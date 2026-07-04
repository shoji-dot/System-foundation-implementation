import { Injectable } from "@nestjs/common";
import type {
  DeviceClassification as PrismaDeviceClassification,
  Jurisdiction as PrismaJurisdiction,
  Regulation as PrismaRegulation,
} from "@prisma/client";

import type {
  ClassificationSearchResult,
  RegulationSearchResult,
  SearchResultItem,
} from "../../../core/domain/search-result.entity";
import type {
  SearchFilters,
  SearchRepository,
  SearchResult,
} from "../../../core/domain/search.repository";
import { PrismaService } from "../prisma.service";

type RegulationWithJurisdiction = PrismaRegulation & { jurisdiction: PrismaJurisdiction };
type DeviceClassificationWithJurisdiction = PrismaDeviceClassification & {
  jurisdiction: PrismaJurisdiction;
};

/**
 * SearchRepository の Prisma 実装（設計書③ infrastructure/database、設計書⑩ search モジュール専用リポジトリ抽象）。
 * scope=regulation/jmdn/generic-name は id（UUIDv7）昇順のキーセットページネーションに対応する。
 * scope=all は regulations/classifications を横断するため、各ソースを limit 件ずつ独立取得し結合するのみで、
 * 統一カーソル・スコアリング(RRF融合)は設計書⑩の高度化実装（Phase1「基本」の対象外）に委ねる。
 * scope=learning はcourses/lessonsテーブル未実装のため常に空配列を返す。
 */
@Injectable()
export class PrismaSearchRepository implements SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(filters: SearchFilters): Promise<SearchResult> {
    switch (filters.scope) {
      case "regulation":
        return this.searchRegulationsOnly(filters);
      case "jmdn":
        return this.searchClassificationsOnly(filters, "code");
      case "generic-name":
        return this.searchClassificationsOnly(filters, "name");
      case "learning":
        return { items: [], nextCursor: null };
      case "all":
      default:
        return this.searchAll(filters);
    }
  }

  private async searchRegulationsOnly(filters: SearchFilters): Promise<SearchResult> {
    const records = await this.prisma.regulation.findMany({
      where: filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { docNumber: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {},
      include: { jurisdiction: true },
      orderBy: { id: "asc" },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: RegulationWithJurisdiction) => this.toRegulationResult(record)),
      nextCursor,
    };
  }

  private async searchClassificationsOnly(
    filters: SearchFilters,
    field: "code" | "name",
  ): Promise<SearchResult> {
    const records = await this.prisma.deviceClassification.findMany({
      where: filters.q
        ? field === "code"
          ? // JMDNコード検索（設計書⑩）: 完全一致/前方一致。containsではなくstartsWithで前方一致を表現する。
            { code: { startsWith: filters.q, mode: "insensitive" } }
          : // 一般的名称検索（設計書⑩）: 前方一致+あいまい(trgm)。trgmは未導入のためcontainsで近似する。
            {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" } },
                { definition: { contains: filters.q, mode: "insensitive" } },
              ],
            }
        : {},
      include: { jurisdiction: true },
      orderBy: { id: "asc" },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: DeviceClassificationWithJurisdiction) =>
        this.toClassificationResult(record),
      ),
      nextCursor,
    };
  }

  private async searchAll(filters: SearchFilters): Promise<SearchResult> {
    const [regulationRecords, classificationRecords] = await Promise.all([
      this.prisma.regulation.findMany({
        where: filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { docNumber: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {},
        include: { jurisdiction: true },
        orderBy: { id: "asc" },
        take: filters.limit,
      }),
      this.prisma.deviceClassification.findMany({
        where: filters.q
          ? {
              OR: [
                { code: { contains: filters.q, mode: "insensitive" } },
                { name: { contains: filters.q, mode: "insensitive" } },
                { definition: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {},
        include: { jurisdiction: true },
        orderBy: { id: "asc" },
        take: filters.limit,
      }),
    ]);

    const items: SearchResultItem[] = [
      ...regulationRecords.map((record: RegulationWithJurisdiction) =>
        this.toRegulationResult(record),
      ),
      ...classificationRecords.map((record: DeviceClassificationWithJurisdiction) =>
        this.toClassificationResult(record),
      ),
    ].slice(0, filters.limit);

    return { items, nextCursor: null };
  }

  private toRegulationResult(record: RegulationWithJurisdiction): RegulationSearchResult {
    return {
      type: "regulation",
      id: record.id,
      jurisdiction: { code: record.jurisdiction.code, name: record.jurisdiction.name },
      regulationType: record.type,
      title: record.title,
      docNumber: record.docNumber,
      status: record.status,
      effectiveDate: record.effectiveDate,
    };
  }

  private toClassificationResult(
    record: DeviceClassificationWithJurisdiction,
  ): ClassificationSearchResult {
    return {
      type: "classification",
      id: record.id,
      jurisdiction: { code: record.jurisdiction.code, name: record.jurisdiction.name },
      scheme: record.scheme,
      code: record.code,
      name: record.name,
      class: record.class,
    };
  }
}
