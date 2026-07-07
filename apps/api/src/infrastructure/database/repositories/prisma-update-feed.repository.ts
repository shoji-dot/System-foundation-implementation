import { Injectable } from "@nestjs/common";
import type {
  Jurisdiction as PrismaJurisdiction,
  Regulation as PrismaRegulation,
  RegulationVersion as PrismaRegulationVersion,
} from "@prisma/client";

import type { UpdateFeedItem } from "../../../core/domain/update-feed-item.entity";
import type {
  UpdateFeedFilters,
  UpdateFeedRepository,
  UpdateFeedResult,
} from "../../../core/domain/update-feed.repository";
import { PrismaService } from "../prisma.service";

type RegulationVersionWithRegulation = PrismaRegulationVersion & {
  regulation: PrismaRegulation & { jurisdiction: PrismaJurisdiction };
};

/**
 * UpdateFeedRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * カーソルページネーションはid（UUIDv7、生成順に単調増加）を使ったキーセット方式
 * （設計書⑤ カーソルページネーション、既存RegulationRepositoryと同じ方式）。
 */
@Injectable()
export class PrismaUpdateFeedRepository implements UpdateFeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: UpdateFeedFilters): Promise<UpdateFeedResult> {
    const records = await this.prisma.regulationVersion.findMany({
      where: {
        // 一般公開APIはPUBLISHED済みの版のみを対象とする（設計書⑧、既存RegulationRepositoryと同じ方針）。
        status: "PUBLISHED",
        ...(filters.since ? { publishedAt: { gt: filters.since } } : {}),
        regulation: {
          ...(filters.jurisdictionCode ? { jurisdiction: { code: filters.jurisdictionCode } } : {}),
          ...(filters.type ? { type: filters.type } : {}),
        },
      },
      include: { regulation: { include: { jurisdiction: true } } },
      orderBy: { id: "asc" },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: RegulationVersionWithRegulation) => this.toDomain(record)),
      nextCursor,
    };
  }

  private toDomain(record: RegulationVersionWithRegulation): UpdateFeedItem {
    return {
      versionId: record.id,
      regulationId: record.regulationId,
      jurisdiction: {
        code: record.regulation.jurisdiction.code,
        name: record.regulation.jurisdiction.name,
      },
      type: record.regulation.type,
      title: record.regulation.title,
      docNumber: record.regulation.docNumber,
      versionNo: record.versionNo,
      changeSummary: record.changeSummary,
      publishedAt: record.publishedAt,
      effectiveFrom: record.effectiveFrom,
      regulationStatus: record.regulation.status,
    };
  }
}
