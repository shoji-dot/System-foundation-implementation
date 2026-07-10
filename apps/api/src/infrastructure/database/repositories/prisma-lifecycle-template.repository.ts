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
  LifecycleTemplateListFilters,
  LifecycleTemplateListResult,
  LifecycleTemplateRepository,
} from "../../../core/domain/lifecycle-template.repository";
import { PrismaService } from "../prisma.service";

type LifecycleTemplateWithJurisdiction = PrismaLifecycleTemplate & {
  jurisdiction: PrismaJurisdiction;
};
type LifecycleTemplateStepWithPhase = PrismaLifecycleTemplateStep & { phase: PrismaLifecyclePhase };

/** lifecycle_template_steps のjsonb列の実行時検証（DBには型保証が無いため、prisma-quiz.repositoryと同方針）。 */
const stringArraySchema = z.array(z.string());
const sourceRefsSchema = z.array(z.object({ title: z.string(), url: z.string() }));

/**
 * LifecycleTemplateRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 一覧のカーソルページネーションはregulationsと同じid（UUIDv7、生成順に単調増加）を使ったキーセット方式。
 */
@Injectable()
export class PrismaLifecycleTemplateRepository implements LifecycleTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPublished(
    filters: LifecycleTemplateListFilters,
  ): Promise<LifecycleTemplateListResult> {
    const where: Prisma.LifecycleTemplateWhereInput = { status: "PUBLISHED" };

    if (filters.jurisdictionCode) {
      where.jurisdiction = { code: filters.jurisdictionCode };
    }
    if (filters.deviceCategory) {
      where.deviceCategory = filters.deviceCategory;
    }
    if (filters.procedureType) {
      where.procedureType = filters.procedureType;
    }

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

  async findPublishedDetailById(id: string): Promise<LifecycleTemplateDetail | null> {
    const record = await this.prisma.lifecycleTemplate.findFirst({
      where: { id, status: "PUBLISHED" },
      include: {
        jurisdiction: true,
        steps: { orderBy: { order: "asc" }, include: { phase: true } },
      },
    });

    if (!record) {
      return null;
    }

    return {
      ...this.toDomain(record),
      steps: record.steps.map((step: LifecycleTemplateStepWithPhase) => this.toStepDomain(step)),
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
