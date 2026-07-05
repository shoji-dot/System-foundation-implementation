import { Injectable } from "@nestjs/common";
import type {
  Jurisdiction as PrismaJurisdiction,
  Prisma,
  Regulation as PrismaRegulation,
  RegulationSection as PrismaRegulationSection,
  RegulationVersion as PrismaRegulationVersion,
} from "@prisma/client";

import type {
  RegulationVersion,
  RegulationVersionSummary,
} from "../../../core/domain/regulation-version.entity";
import type { Regulation, RegulationDetail } from "../../../core/domain/regulation.entity";
import type {
  RegulationListFilters,
  RegulationListResult,
  RegulationRepository,
  RegulationVersionDiffPair,
  RegulationVersionListFilters,
  RegulationVersionListResult,
} from "../../../core/domain/regulation.repository";
import { PrismaService } from "../prisma.service";

type RegulationWithJurisdiction = PrismaRegulation & { jurisdiction: PrismaJurisdiction };
type RegulationVersionWithSections = PrismaRegulationVersion & {
  sections: PrismaRegulationSection[];
};

/**
 * RegulationRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 法規文書一覧のカーソルページネーションは id（UUIDv7、生成順に単調増加）を使ったキーセット方式。
 * バージョン一覧のカーソルページネーションは versionNo（regulation内で一意な連番）を使ったキーセット方式。
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

  async findDetailById(id: string): Promise<RegulationDetail | null> {
    const record = await this.prisma.regulation.findUnique({
      where: { id },
      include: {
        jurisdiction: true,
        // 最新版はPUBLISHEDのみを対象とする（設計書⑧、draft/review中の版は一般公開しない）。
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { versionNo: "desc" },
          take: 1,
          include: { sections: { orderBy: { createdAt: "asc" } } },
        },
      },
    });

    if (!record) {
      return null;
    }

    const latestVersionRecord = record.versions[0];

    return {
      ...this.toDomain(record),
      latestVersion: latestVersionRecord ? this.toVersionDomain(latestVersionRecord) : null,
    };
  }

  async findVersions(
    regulationId: string,
    filters: RegulationVersionListFilters,
  ): Promise<RegulationVersionListResult | null> {
    const regulationExists = await this.prisma.regulation.findUnique({
      where: { id: regulationId },
      select: { id: true },
    });
    if (!regulationExists) {
      return null;
    }

    // cursor はクエリDTO側(listRegulationVersionsQuerySchema)で数値文字列であることを検証済み。
    const cursorVersionNo = filters.cursor ? Number.parseInt(filters.cursor, 10) : undefined;

    const records = await this.prisma.regulationVersion.findMany({
      where: {
        regulationId,
        // 改正履歴はPUBLISHEDのみを対象とする（設計書⑧、draft/review中の版は一般公開しない）。
        status: "PUBLISHED",
        ...(cursorVersionNo !== undefined ? { versionNo: { lt: cursorVersionNo } } : {}),
      },
      orderBy: { versionNo: "desc" },
      take: filters.limit + 1,
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.versionNo.toString() ?? null) : null;

    return {
      items: page.map((record: PrismaRegulationVersion) => this.toVersionSummaryDomain(record)),
      nextCursor,
    };
  }

  async findVersionsForDiff(
    regulationId: string,
    fromVersionNo: number,
    toVersionNo: number,
  ): Promise<RegulationVersionDiffPair | null> {
    const records = await this.prisma.regulationVersion.findMany({
      where: {
        regulationId,
        // 差分対象もPUBLISHEDのみとする（設計書⑧、draft/review中の版は一般公開しない）。
        status: "PUBLISHED",
        versionNo: { in: [fromVersionNo, toVersionNo] },
      },
      include: { sections: { orderBy: { createdAt: "asc" } } },
    });

    const fromRecord = records.find((record) => record.versionNo === fromVersionNo);
    const toRecord = records.find((record) => record.versionNo === toVersionNo);
    if (!fromRecord || !toRecord) {
      return null;
    }

    return {
      from: this.toVersionDomain(fromRecord),
      to: this.toVersionDomain(toRecord),
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

  private toVersionDomain(record: RegulationVersionWithSections): RegulationVersion {
    return {
      id: record.id,
      versionNo: record.versionNo,
      publishedAt: record.publishedAt,
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo,
      fullText: record.fullText,
      summary: record.summary,
      changeSummary: record.changeSummary,
      sections: record.sections.map((section: PrismaRegulationSection) => ({
        id: section.id,
        path: section.path,
        heading: section.heading,
        body: section.body,
      })),
    };
  }

  private toVersionSummaryDomain(record: PrismaRegulationVersion): RegulationVersionSummary {
    return {
      id: record.id,
      versionNo: record.versionNo,
      publishedAt: record.publishedAt,
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo,
      summary: record.summary,
      changeSummary: record.changeSummary,
    };
  }
}
