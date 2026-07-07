import { Injectable } from "@nestjs/common";

import type { RagSearchHit, RagSearchRepository } from "../../../core/domain/rag-search.repository";
import { PrismaService } from "../prisma.service";

/** 各手法（ベクトル/pg_trgm）ごとに取得する候補件数。RRF融合前の母集団。 */
const CANDIDATE_FETCH_SIZE = 20;
/** RRF（Reciprocal Rank Fusion）の定数k。1/(k+rank)のkとして一般的に用いられる値。 */
const RRF_K = 60;

interface RankedRow {
  id: string;
}

/**
 * RagSearchRepository の Prisma 実装（設計書③ infrastructure/database、設計書⑥ RAGパイプライン）。
 * 設計書⑥「ハイブリッド検索（pgvector cos類似 + pg全文検索、RRF融合）」に対応する。
 * 「pg全文検索」は schema.prisma の方針（pg_trgm: 日本語含むあいまい全文検索）に準拠し、
 * to_tsvector/tsquery（日本語未対応）ではなく pg_trgm の類似演算子(%)を用いる。
 * embedding列は Prisma schema 上 Unsupported("vector(1536)") のため $queryRaw で直接SQLを発行する
 * （PrismaRegulationSectionEmbeddingRepositoryと同方針）。
 */
@Injectable()
export class PrismaRagSearchRepository implements RagSearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hybridSearch(
    query: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RagSearchHit[]> {
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    // PUBLISHED版のセクションのみを対象に、ベクトル類似順位とpg_trgm類似順位をそれぞれ算出し、
    // RRFスコア（1/(k+rank)の合計）でFULL OUTER JOINにより統合する。
    const ranked = await this.prisma.$queryRaw<RankedRow[]>`
      WITH candidates AS (
        SELECT rs.id
        FROM regulation_sections rs
        JOIN regulation_versions rv ON rv.id = rs.version_id
        WHERE rv.status = 'PUBLISHED'
      ),
      vector_ranked AS (
        SELECT rs.id, ROW_NUMBER() OVER (ORDER BY rs.embedding <=> ${vectorLiteral}::vector) AS rank
        FROM regulation_sections rs
        JOIN candidates c ON c.id = rs.id
        WHERE rs.embedding IS NOT NULL
        ORDER BY rs.embedding <=> ${vectorLiteral}::vector
        LIMIT ${CANDIDATE_FETCH_SIZE}
      ),
      trgm_ranked AS (
        SELECT rs.id, ROW_NUMBER() OVER (ORDER BY similarity(rs.body, ${query}) DESC) AS rank
        FROM regulation_sections rs
        JOIN candidates c ON c.id = rs.id
        WHERE rs.body % ${query}
        ORDER BY similarity(rs.body, ${query}) DESC
        LIMIT ${CANDIDATE_FETCH_SIZE}
      )
      SELECT COALESCE(v.id, t.id) AS id
      FROM vector_ranked v
      FULL OUTER JOIN trgm_ranked t ON v.id = t.id
      ORDER BY (COALESCE(1.0 / (${RRF_K} + v.rank), 0) + COALESCE(1.0 / (${RRF_K} + t.rank), 0)) DESC
      LIMIT ${topK}
    `;

    if (ranked.length === 0) {
      return [];
    }

    const ids = ranked.map((row) => row.id);
    const sections = await this.prisma.regulationSection.findMany({
      where: { id: { in: ids } },
      include: {
        version: { include: { regulation: { include: { jurisdiction: true } } } },
      },
    });
    const sectionsById = new Map(sections.map((section) => [section.id, section]));

    // RRFスコア順（ranked配列の順序）を維持して返す（findManyのinはDB側の順序を保証しないため）。
    return ids.flatMap((id): RagSearchHit[] => {
      const section = sectionsById.get(id);
      if (!section) {
        return [];
      }

      return [
        {
          sectionId: section.id,
          body: section.body,
          citation: {
            sectionId: section.id,
            regulationId: section.version.regulation.id,
            regulationTitle: section.version.regulation.title,
            jurisdiction: {
              code: section.version.regulation.jurisdiction.code,
              name: section.version.regulation.jurisdiction.name,
            },
            versionNo: section.version.versionNo,
            effectiveFrom: section.version.effectiveFrom,
            effectiveTo: section.version.effectiveTo,
            path: section.path,
            heading: section.heading,
          },
        },
      ];
    });
  }
}
