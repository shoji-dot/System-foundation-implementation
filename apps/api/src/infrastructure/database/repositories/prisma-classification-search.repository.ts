import { Injectable } from "@nestjs/common";

import type {
  ClassificationSearchCandidate,
  ClassificationSearchRepository,
} from "../../../core/domain/classification-search.repository";
import { PrismaService } from "../prisma.service";

interface RankedRow {
  id: string;
}

/**
 * ClassificationSearchRepository の Prisma 実装（設計書③ infrastructure/database、設計書⑥「検索+LLM再ランク」の検索段階）。
 * pg_trgm（schema.prisma記載の方針: 日本語含むあいまい全文検索）のsimilarity()で
 * name/definitionと機器説明文の類似度順にshortlistを作る。embedding列が無いためベクトル検索は行わない
 * （ユーザー承認済み方針）。
 */
@Injectable()
export class PrismaClassificationSearchRepository implements ClassificationSearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchByDeviceDescription(
    description: string,
    limit: number,
  ): Promise<ClassificationSearchCandidate[]> {
    const ranked = await this.prisma.$queryRaw<RankedRow[]>`
      SELECT dc.id
      FROM device_classifications dc
      WHERE (dc.name || ' ' || COALESCE(dc.definition, '')) % ${description}
      ORDER BY similarity(dc.name || ' ' || COALESCE(dc.definition, ''), ${description}) DESC
      LIMIT ${limit}
    `;

    if (ranked.length === 0) {
      return [];
    }

    const ids = ranked.map((row) => row.id);
    const records = await this.prisma.deviceClassification.findMany({
      where: { id: { in: ids } },
      include: { jurisdiction: true },
    });
    const recordsById = new Map(records.map((record) => [record.id, record]));

    // pg_trgmの類似度順（ranked配列の順序）を維持する（findManyのinはDB側の順序を保証しないため）。
    return ids.flatMap((id): ClassificationSearchCandidate[] => {
      const record = recordsById.get(id);
      if (!record) {
        return [];
      }

      return [
        {
          id: record.id,
          scheme: record.scheme,
          jurisdiction: { code: record.jurisdiction.code, name: record.jurisdiction.name },
          code: record.code,
          name: record.name,
          class: record.class,
          definition: record.definition,
        },
      ];
    });
  }
}
