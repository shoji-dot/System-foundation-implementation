import { Injectable } from "@nestjs/common";
import type {
  Jurisdiction as PrismaJurisdiction,
  LifecyclePhase as PrismaLifecyclePhase,
  LifecycleTemplate as PrismaLifecycleTemplate,
  LifecycleTemplateStep as PrismaLifecycleTemplateStep,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { z } from "zod";

import type { JurisdictionCode } from "../../../core/domain/jurisdiction.entity";
import type { LifecyclePhase } from "../../../core/domain/lifecycle-phase.entity";
import type {
  LifecycleDeviceClass,
  LifecycleFramework,
  LifecycleProductNovelty,
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

/**
 * 特性タグの対象種別（Phase7 7-2再設計）。tags/taggings（設計書④共通、S21）を再利用し、
 * SaMD/能動植込み等の「特性」をenum固定化せずタグとして表現する。tags.moduleへのDI依存を避けるため
 * （lifecycle→tags のモジュール間依存を発生させないため）、本リポジトリから直接Prismaで読み書きする
 * （TagRepository/TaggingRepositoryと同じテーブルを扱うが、実装は独立させるユーザー承認済みの判断）。
 */
const LIFECYCLE_TEMPLATE_TAGGABLE_TYPE = "LIFECYCLE_TEMPLATE" as const;

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
    if (!record) {
      return null;
    }

    const characteristics = await this.listCharacteristics(record.id);
    return this.toDetailDomain(record, characteristics);
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
    if (!record) {
      return null;
    }

    const characteristics = await this.listCharacteristics(record.id);
    return this.toDetailDomain(record, characteristics);
  }

  async findAllPhases(): Promise<LifecyclePhase[]> {
    const records = await this.prisma.lifecyclePhase.findMany({ orderBy: { order: "asc" } });
    return records.map((record) => this.toPhaseDomain(record));
  }

  async create(input: LifecycleTemplateWriteInput): Promise<LifecycleTemplateDetail> {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.lifecycleTemplate.create({
        data: {
          jurisdiction: { connect: { code: input.jurisdictionCode } },
          framework: input.framework,
          deviceClass: input.deviceClass,
          productNovelty: input.productNovelty,
          approvalRoute: input.approvalRoute,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo,
          steps: { create: input.steps.map((step) => this.toStepCreateData(step)) },
        },
        include: DETAIL_INCLUDE,
      });

      await this.replaceCharacteristics(tx, record.id, input.characteristics);
      return this.toDetailDomain(record, input.characteristics);
    });
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
          framework: input.framework,
          deviceClass: input.deviceClass,
          productNovelty: input.productNovelty,
          approvalRoute: input.approvalRoute,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo,
          steps: { create: input.steps.map((step) => this.toStepCreateData(step)) },
        },
        include: DETAIL_INCLUDE,
      });

      await this.replaceCharacteristics(tx, record.id, input.characteristics);
      return this.toDetailDomain(record, input.characteristics);
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.lifecycleTemplate.findUnique({ where: { id } });
      if (!existing || existing.status !== "DRAFT") {
        return false;
      }

      // lifecycle_template_steps は template_id に onDelete: Cascade のためstepsは自動削除される。
      // taggingsはtaggableIdへの外部キー制約が無い（polymorphic設計）ため明示的に削除する。
      await tx.tagging.deleteMany({
        where: { taggableType: LIFECYCLE_TEMPLATE_TAGGABLE_TYPE, taggableId: id },
      });
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

      const characteristics = await this.listCharacteristics(id, tx);
      return this.toDetailDomain(record, characteristics);
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

    // characteristicsはpolymorphicなtaggingsのため一括バッチ取得する（1クエリでN+1を回避）。
    const characteristicsByTemplateId = await this.batchListCharacteristics(
      page.map((record: LifecycleTemplateWithJurisdiction) => record.id),
    );

    return {
      items: page.map((record: LifecycleTemplateWithJurisdiction) =>
        this.toDomain(record, characteristicsByTemplateId.get(record.id) ?? []),
      ),
      nextCursor,
    };
  }

  private buildFilterWhere(filters: {
    jurisdictionCode?: JurisdictionCode;
    framework?: LifecycleFramework;
    deviceClass?: LifecycleDeviceClass;
    approvalRoute?: string;
  }): Prisma.LifecycleTemplateWhereInput {
    const where: Prisma.LifecycleTemplateWhereInput = {};

    if (filters.jurisdictionCode) {
      where.jurisdiction = { code: filters.jurisdictionCode };
    }
    if (filters.framework) {
      where.framework = filters.framework;
    }
    if (filters.deviceClass) {
      where.deviceClass = filters.deviceClass;
    }
    if (filters.approvalRoute) {
      where.approvalRoute = filters.approvalRoute;
    }

    return where;
  }

  /**
   * 特性タグの find-or-create + 一括置換（Phase7 7-2再設計）。tags/taggings（S21と共通のテーブル）を
   * 直接扱う。update時は既存taggingsを一旦全削除してから作り直す（steps同様「丸ごと置換」方式）。
   */
  private async replaceCharacteristics(
    tx: Prisma.TransactionClient,
    templateId: string,
    characteristics: string[],
  ): Promise<void> {
    await tx.tagging.deleteMany({
      where: { taggableType: LIFECYCLE_TEMPLATE_TAGGABLE_TYPE, taggableId: templateId },
    });

    for (const name of characteristics) {
      const tag = await tx.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      await tx.tagging.create({
        data: { tagId: tag.id, taggableType: LIFECYCLE_TEMPLATE_TAGGABLE_TYPE, taggableId: templateId },
      });
    }
  }

  private async listCharacteristics(
    templateId: string,
    client: Prisma.TransactionClient | PrismaClient = this.prisma,
  ): Promise<string[]> {
    const taggings = await client.tagging.findMany({
      where: { taggableType: LIFECYCLE_TEMPLATE_TAGGABLE_TYPE, taggableId: templateId },
      include: { tag: true },
      orderBy: { createdAt: "asc" },
    });

    return taggings.map((tagging) => tagging.tag.name);
  }

  private async batchListCharacteristics(
    templateIds: string[],
  ): Promise<Map<string, string[]>> {
    if (templateIds.length === 0) {
      return new Map();
    }

    const taggings = await this.prisma.tagging.findMany({
      where: { taggableType: LIFECYCLE_TEMPLATE_TAGGABLE_TYPE, taggableId: { in: templateIds } },
      include: { tag: true },
      orderBy: { createdAt: "asc" },
    });

    const result = new Map<string, string[]>();
    for (const tagging of taggings) {
      const current = result.get(tagging.taggableId) ?? [];
      current.push(tagging.tag.name);
      result.set(tagging.taggableId, current);
    }

    return result;
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
      sourceRefs: step.sourceRefs as unknown as Prisma.InputJsonValue,
    };
  }

  private toDomain(
    record: LifecycleTemplateWithJurisdiction,
    characteristics: string[],
  ): LifecycleTemplate {
    return {
      id: record.id,
      jurisdiction: {
        code: record.jurisdiction.code as JurisdictionCode,
        name: record.jurisdiction.name,
      },
      framework: record.framework as LifecycleFramework,
      deviceClass: record.deviceClass as LifecycleDeviceClass | null,
      productNovelty: record.productNovelty as LifecycleProductNovelty | null,
      approvalRoute: record.approvalRoute,
      characteristics,
      status: record.status as LifecycleTemplateStatus,
      version: record.version,
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo,
      createdAt: record.createdAt,
    };
  }

  private toDetailDomain(
    record: LifecycleTemplateWithJurisdictionAndSteps,
    characteristics: string[],
  ): LifecycleTemplateDetail {
    return {
      ...this.toDomain(record, characteristics),
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
