import { Injectable } from "@nestjs/common";
import type {
  Jurisdiction as PrismaJurisdiction,
  Prisma,
  Regulation as PrismaRegulation,
} from "@prisma/client";

import type { Regulation } from "../../../core/domain/regulation.entity";
import type {
  RegulationListFilters,
  RegulationListResult,
  RegulationRepository,
} from "../../../core/domain/regulation.repository";
import { PrismaService } from "../prisma.service";

type RegulationWithJurisdiction = PrismaRegulation & { jurisdiction: PrismaJurisdiction };

/**
 * RegulationRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * カーソルページネーションは id（UUIDv7、生成順に単調増加）を使ったキーセット方式。
 */
@Injectable()
export class PrismaRegulationRepository implements RegulationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: RegulationListFilters): Promise<RegulationListResult> {
    const where: Prisma.RegulationWhereInput = {};

    if (filters.jurisdictionCode) {
      where.jurisdiction = { code: filters.jurisdictionCode };
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: "insensitive" } },
        { docNumber: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    const records = await this.prisma.regulation.findMany({
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
      items: page.map((record: RegulationWithJurisdiction) => this.toDomain(record)),
      nextCursor,
    };
  }

  private toDomain(record: RegulationWithJurisdiction): Regulation {
    return {
      id: record.id,
      jurisdiction: { code: record.jurisdiction.code, name: record.jurisdiction.name },
      type: record.type,
      subtype: record.subtype,
      title: record.title,
      docNumber: record.docNumber,
      status: record.status,
      effectiveDate: record.effectiveDate,
      sourceUrl: record.sourceUrl,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
