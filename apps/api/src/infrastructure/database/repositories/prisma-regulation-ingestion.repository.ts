import { Injectable } from "@nestjs/common";
import type {
  Jurisdiction as PrismaJurisdiction,
  Prisma,
  Regulation as PrismaRegulation,
  RegulationVersion as PrismaRegulationVersion,
} from "@prisma/client";

import type { JurisdictionCode } from "../../../core/domain/jurisdiction.entity";
import type {
  AppendDraftVersionInput,
  CreateRegulationWithDraftVersionInput,
  LatestRegulationVersionForIngestion,
  PendingReviewVersionDetail,
  PendingReviewVersionListFilters,
  PendingReviewVersionListResult,
  PendingReviewVersionSummary,
  RegulationIngestionRepository,
} from "../../../core/domain/regulation-ingestion.repository";
import { PrismaService } from "../prisma.service";

type PendingReviewRecord = PrismaRegulationVersion & {
  regulation: PrismaRegulation & { jurisdiction: PrismaJurisdiction };
};

/**
 * RegulationIngestionRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 既知の簡略化: docNumberはDBレベルで一意制約が無いため、同一法域内で重複した場合は先着の1件を返す
 * （取込元doc_numberの重複は想定していないが、厳密な一意性保証はスコープ外）。
 */
@Injectable()
export class PrismaRegulationIngestionRepository implements RegulationIngestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestByDocNumber(
    jurisdictionCode: JurisdictionCode,
    docNumber: string,
  ): Promise<LatestRegulationVersionForIngestion | null> {
    const regulation = await this.prisma.regulation.findFirst({
      where: { jurisdiction: { code: jurisdictionCode }, docNumber },
      include: {
        versions: { orderBy: { versionNo: "desc" }, take: 1 },
      },
    });

    if (!regulation) {
      return null;
    }

    const latestVersion = regulation.versions[0];
    if (!latestVersion) {
      // データ不整合(regulationは存在するがversionが1件も無い)。取込側は新版追加として扱えるようnullを返す。
      return null;
    }

    return {
      regulationId: regulation.id,
      latestVersionNo: latestVersion.versionNo,
      latestFullText: latestVersion.fullText,
    };
  }

  async createWithDraftVersion(
    input: CreateRegulationWithDraftVersionInput,
  ): Promise<{ regulationId: string; versionId: string }> {
    const jurisdiction = await this.prisma.jurisdiction.findUniqueOrThrow({
      where: { code: input.jurisdictionCode },
    });

    const regulation = await this.prisma.regulation.create({
      data: {
        jurisdictionId: jurisdiction.id,
        type: input.type,
        subtype: input.subtype,
        title: input.title,
        docNumber: input.docNumber,
        status: "ACTIVE",
        effectiveDate: input.effectiveDate,
        sourceUrl: input.sourceUrl,
        versions: {
          create: {
            versionNo: 1,
            publishedAt: input.effectiveDate,
            effectiveFrom: input.effectiveDate,
            fullText: input.fullText,
            status: "DRAFT",
          },
        },
      },
      include: { versions: true },
    });

    const version = regulation.versions[0];
    if (!version) {
      throw new Error("初版regulation_versionの作成に失敗しました。");
    }

    return { regulationId: regulation.id, versionId: version.id };
  }

  async appendDraftVersion(input: AppendDraftVersionInput): Promise<{ versionId: string }> {
    const [, version] = await this.prisma.$transaction([
      // 親Regulationのtitle/effectiveDate/sourceUrl/type/subtypeをdraft作成時点で即時更新する
      // （要ユーザー確認済み、S20公開承認前でも一般向け一覧・詳細APIはPUBLISHED版のみ参照するため影響は限定的）。
      this.prisma.regulation.update({
        where: { id: input.regulationId },
        data: {
          title: input.title,
          subtype: input.subtype,
          type: input.type,
          effectiveDate: input.effectiveDate,
          sourceUrl: input.sourceUrl,
        },
      }),
      this.prisma.regulationVersion.create({
        data: {
          regulationId: input.regulationId,
          versionNo: input.versionNo,
          publishedAt: input.effectiveDate,
          effectiveFrom: input.effectiveDate,
          fullText: input.fullText,
          changeSummary: input.changeSummary,
          status: "DRAFT",
        },
      }),
    ]);

    return { versionId: version.id };
  }

  async listPendingReview(
    filters: PendingReviewVersionListFilters,
  ): Promise<PendingReviewVersionListResult> {
    const where: Prisma.RegulationVersionWhereInput = {
      status: { in: ["DRAFT", "REVIEW"] },
    };

    const records = await this.prisma.regulationVersion.findMany({
      where,
      include: { regulation: { include: { jurisdiction: true } } },
      orderBy: { id: "asc" },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: PendingReviewRecord) => this.toPendingSummary(record)),
      nextCursor,
    };
  }

  async findPendingReviewDetail(versionId: string): Promise<PendingReviewVersionDetail | null> {
    const record = await this.prisma.regulationVersion.findUnique({
      where: { id: versionId },
      include: { regulation: { include: { jurisdiction: true } } },
    });

    if (!record || record.status === "PUBLISHED") {
      return null;
    }

    const currentPublished = await this.prisma.regulationVersion.findFirst({
      where: { regulationId: record.regulationId, status: "PUBLISHED" },
      orderBy: { versionNo: "desc" },
    });

    return {
      ...this.toPendingSummary(record),
      fullText: record.fullText,
      currentPublished: currentPublished
        ? {
            versionId: currentPublished.id,
            versionNo: currentPublished.versionNo,
            fullText: currentPublished.fullText,
            effectiveFrom: currentPublished.effectiveFrom,
          }
        : null,
    };
  }

  private toPendingSummary(record: PendingReviewRecord): PendingReviewVersionSummary {
    if (record.status === "PUBLISHED") {
      // listPendingReview/findPendingReviewDetail の呼び出し元でPUBLISHEDは除外済みのため到達しない。
      throw new Error("PUBLISHED版はレビュー対象ではありません。");
    }

    return {
      id: record.id,
      regulationId: record.regulation.id,
      regulationTitle: record.regulation.title,
      jurisdiction: {
        code: record.regulation.jurisdiction.code,
        name: record.regulation.jurisdiction.name,
      },
      type: record.regulation.type,
      status: record.status,
      versionNo: record.versionNo,
      effectiveFrom: record.effectiveFrom,
      changeSummary: record.changeSummary,
      createdAt: record.createdAt,
    };
  }
}
