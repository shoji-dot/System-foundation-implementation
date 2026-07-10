import { Injectable } from "@nestjs/common";
import type {
  Jurisdiction as PrismaJurisdiction,
  LifecyclePhase as PrismaLifecyclePhase,
  LifecycleTemplate as PrismaLifecycleTemplate,
  LifecycleTemplateStep as PrismaLifecycleTemplateStep,
  Prisma,
} from "@prisma/client";
import { z } from "zod";

import type { JurisdictionCode } from "../../../core/domain/jurisdiction.entity";
import type { LifecyclePhase } from "../../../core/domain/lifecycle-phase.entity";
import type {
  LifecycleDeviceCategory,
  LifecycleTemplate,
  LifecycleTemplateDetail,
  LifecycleTemplateSourceRef,
  LifecycleTemplateStatus,
  LifecycleTemplateStep,
} from "../../../core/domain/lifecycle-template.entity";
import type {
  AdminLifecycleTemplateListFilters,
  LifecycleTemplateListFilters,
  LifecycleTemplateListResult,
  LifecycleTemplateRepository,
  LifecycleTemplateWriteInput,
} from "../../../core/domain/lifecycle-template.repository";
import { PrismaService } from "../prisma.service";

type LifecycleTemplateWithJurisdiction = PrismaLifecycleTemplate & {
  jurisdiction: PrismaJurisdiction;
};
type LifecycleTemplateStepWithPhase = PrismaLifecycleTemplateStep & { phase: PrismaLifecyclePhase };
type LifecycleTemplateWithJurisdictionAndSteps = LifecycleTemplateWithJurisdiction & {
  steps: LifecycleTemplateStepWithPhase[];
};

/** lifecycle_template_steps のjsonb列の実行時検証（DBには型保証が無いため、prisma-quiz.repositoryと同方針）。 */
const stringArraySchema = z.array(z.string());
const sourceRefsSchema = z.array(z.object({ title: z.string(), url: z.string() }));

const DETAIL_INCLUDE = {
  jurisdiction: true,
  steps: { orderBy: { order: "asc" as const }, include: { phase: true } },
} satisfies Prisma.LifecycleTemplateInclude;

/**
 * LifecycleTemplateRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 一覧のカーソルページネーションはregulationsと同じid（UUIDv7、生成順に単調増加）を使ったキーセット方式。
 * admin向け書き込み系（create/update/delete/publish）は7-2 PR③で追加（設計変更書③「CRUD
 * /api/v1/admin/lifecycle-templates、S20と同じdraft→publishフロー」準拠）。
 */
@Injectable()
export class PrismaLifecycleTemplateRepository implements LifecycleTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPublished(
    filters: LifecycleTemplateListFilters,
  ): Promise<LifecycleTemplateListResult> {
    return this.findManyByWhere(
      { ...this.buildFilterWhere(filters), status: "PUBLISHED" },
      filters,
    );
  }

  async findPublishedDetailById(id: string): Promise<LifecycleTemplateDetail | null> {
    const record = await this.prisma.lifecycleTemplate.findFirst({
      where: { id, status: "PUBLISHED" },
      include: DETAIL_INCLUDE,
    });

    return record ? this.toDetailDomain(record) : null;
  }

  async findManyForAdmin(
    filters: AdminLifecycleTemplateListFilters,
  ): Promise<LifecycleTemplateListResult> {
    const where = this.buildFilterWhere(filters);
    if (filters.status) {
      where.status = filters.status;
    }

    return this.findManyByWhere(where, filters);
  }

  async findDetailByIdForAdmin(id: string): Promise<LifecycleTemplateDetail | null> {
    const record = await this.prisma.lifecycleTemplate.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });

    return record ? this.toDetailDomain(record) : null;
  }

  async findAllPhases(): Promise<LifecyclePhase[]> {
    const records = await this.prisma.lifecyclePhase.findMany({ orderBy: { order: "asc" } });
    return records.map((record) => this.toPhaseDomain(record));
  }

  async create(input: LifecycleTemplateWriteInput): Promise<LifecycleTemplateDetail> {
    const record = await this.prisma.lifecycleTemplate.create({
      data: {
        jurisdiction: { connect: { code: input.jurisdictionCode } },
        deviceCategory: input.deviceCategory,
        procedureType: input.procedureType,
        steps: { create: input.steps.map((step) => this.toStepCreateData(step)) },
      },
      include: DETAIL_INCLUDE,
    });

    return this.toDetailDomain(record);
  }

  async update(
    id: string,
    input: LifecycleTemplateWriteInput,
  ): Promise<LifecycleTemplateDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.lifecycleTemplate.findUnique({ where: { id } });
      if (!existing || existing.status !== "DRAFT") {
        return null;
      }

      // 工程一覧は丸ごと置き換える（個別差分更新はサポートしない、1ドキュメントとして扱う設計）。
      await tx.lifecycleTemplateStep.deleteMany({ where: { templateId: id } });

      const record = await tx.lifecycleTemplate.update({
        where: { id },
        data: {
          jurisdiction: { connect: { code: input.jurisdictionCode } },
          deviceCategory: input.deviceCategory,
          procedureType: input.procedureType,
          steps: { create: input.steps.map((step) => this.toStepCreateData(step)) },
        },
        include: DETAIL_INCLUDE,
      });

      return this.toDetailDomain(record);
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.lifecycleTemplate.findUnique({ where: { id } });
      if (!existing || existing.status !== "DRAFT") {
        return false;
      }

      // lifecycle_template_steps は template_id に onDelete: Cascade のためstepsは自動削除される。
      await tx.lifecycleTemplate.delete({ where: { id } });
      return true;
    });
  }

  async publish(id: string): Promise<LifecycleTemplateDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.lifecycleTemplate.findUnique({ where: { id } });
      if (!existing || existing.status === "PUBLISHED") {
        return null;
      }

      const record = await tx.lifecycleTemplate.update({
        where: { id },
        data: { status: "PUBLISHED" },
        include: DETAIL_INCLUDE,
      });

      return this.toDetailDomain(record);
    });
  }

  private async findManyByWhere(
    where: Prisma.LifecycleTemplateWhereInput,
    filters: { cursor?: string; limit: number },
  ): Promise<LifecycleTemplateListResult> {
    const records = await this.prisma.lifecycleTemplate.findMany({
      where,
      include: { jurisdiction: true },
      orderBy: { id: "asc" },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: LifecycleTemplateWithJurisdiction) => this.toDomain(record)),
      nextCursor,
    };
  }

  private buildFilterWhere(filters: {
    jurisdictionCode?: JurisdictionCode;
    deviceCategory?: LifecycleDeviceCategory;
    procedureType?: string;
  }): Prisma.LifecycleTemplateWhereInput {
    const where: Prisma.LifecycleTemplateWhereInput = {};

    if (filters.jurisdictionCode) {
      where.jurisdiction = { code: filters.jurisdictionCode };
    }
    if (filters.deviceCategory) {
      where.deviceCategory = filters.deviceCategory;
    }
    if (filters.procedureType) {
      where.procedureType = filters.procedureType;
    }

    return where;
  }

  private toStepCreateData(
    step: LifecycleTemplateWriteInput["steps"][number],
  ): Prisma.LifecycleTemplateStepCreateWithoutTemplateInput {
    return {
      phase: { connect: { code: step.phaseCode } },
      name: step.name,
      order: step.order,
      durationMinDays: step.durationMinDays,
      durationMaxDays: step.durationMaxDays,
      costMinJpy: step.costMinJpy,
      costMaxJpy: step.costMaxJpy,
      requiredDocuments: step.requiredDocuments,
      requiredTests: step.requiredTests,
      relatedRegulationIds: step.relatedRegulationIds,
      pmdaResourceUrls: step.pmdaResourceUrls,
      notes: step.notes,
      sourceRefs: step.sourceRefs,
    };
  }

  private toDomain(record: LifecycleTemplateWithJurisdiction): LifecycleTemplate {
    return {
      id: record.id,
      jurisdiction: {
        code: record.jurisdiction.code as JurisdictionCode,
        name: record.jurisdiction.name,
      },
      deviceCategory: record.deviceCategory as LifecycleDeviceCategory,
      procedureType: record.procedureType,
      status: record.status as LifecycleTemplateStatus,
      version: record.version,
      createdAt: record.createdAt,
    };
  }

  private toDetailDomain(
    record: LifecycleTemplateWithJurisdictionAndSteps,
  ): LifecycleTemplateDetail {
    return {
      ...this.toDomain(record),
      steps: record.steps.map((step: LifecycleTemplateStepWithPhase) => this.toStepDomain(step)),
    };
  }

  private toStepDomain(record: LifecycleTemplateStepWithPhase): LifecycleTemplateStep {
    return {
      id: record.id,
      phase: this.toPhaseDomain(record.phase),
      name: record.name,
      order: record.order,
      durationMinDays: record.durationMinDays,
      durationMaxDays: record.durationMaxDays,
      costMinJpy: record.costMinJpy,
      costMaxJpy: record.costMaxJpy,
      requiredDocuments: this.parseStringArray(record.requiredDocuments),
      requiredTests: this.parseStringArray(record.requiredTests),
      relatedRegulationIds: record.relatedRegulationIds,
      pmdaResourceUrls: this.parseStringArray(record.pmdaResourceUrls),
      notes: record.notes,
      sourceRefs: this.parseSourceRefs(record.sourceRefs),
    };
  }

  private toPhaseDomain(record: PrismaLifecyclePhase): LifecyclePhase {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      order: record.order,
    };
  }

  private parseStringArray(value: Prisma.JsonValue): string[] {
    return stringArraySchema.parse(value);
  }

  private parseSourceRefs(value: Prisma.JsonValue): LifecycleTemplateSourceRef[] {
    return sourceRefsSchema.parse(value);
  }
}
