import { Injectable } from "@nestjs/common";

import type {
  RegulationSectionEmbeddingRepository,
  RegulationSectionForEmbedding,
} from "../../../core/domain/regulation-section-embedding.repository";
import { PrismaService } from "../prisma.service";

/**
 * RegulationSectionEmbeddingRepository の Prisma 実装（設計書③ infrastructure/database）。
 * embedding列は Prisma schema 上 Unsupported("vector(1536)") のため通常の Prisma Client API
 * では読み書きできず、$queryRaw/$executeRaw で直接SQLを発行する（pgvectorのテキスト表現
 * '[0.1,0.2,...]' を vector へキャストする）。
 */
@Injectable()
export class PrismaRegulationSectionEmbeddingRepository implements RegulationSectionEmbeddingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyWithoutEmbedding(limit: number): Promise<RegulationSectionForEmbedding[]> {
    return this.prisma.$queryRaw<RegulationSectionForEmbedding[]>`
      SELECT "id", "body" FROM "regulation_sections"
      WHERE "embedding" IS NULL
      ORDER BY "created_at" ASC
      LIMIT ${limit}
    `;
  }

  async saveEmbedding(sectionId: string, embedding: number[]): Promise<void> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    await this.prisma.$executeRaw`
      UPDATE "regulation_sections"
      SET "embedding" = ${vectorLiteral}::vector, "updated_at" = now()
      WHERE "id" = ${sectionId}::uuid
    `;
  }
}
