import { Injectable } from "@nestjs/common";
import type { IngestionJob as PrismaIngestionJob } from "@prisma/client";

import type { IngestionJob } from "../../../core/domain/ingestion-job.entity";
import type {
  CreateIngestionJobInput,
  IngestionJobRepository,
  UpdateIngestionJobInput,
} from "../../../core/domain/ingestion-job.repository";
import { PrismaService } from "../prisma.service";

/**
 * IngestionJobRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaIngestionJobRepository implements IngestionJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateIngestionJobInput): Promise<IngestionJob> {
    const record = await this.prisma.ingestionJob.create({
      data: {
        source: input.source,
        status: input.status,
        diffSummary: input.diffSummary ?? null,
        errorMessage: input.errorMessage ?? null,
        runAt: input.runAt,
      },
    });

    return this.toDomain(record);
  }

  async update(id: string, input: UpdateIngestionJobInput): Promise<IngestionJob> {
    const record = await this.prisma.ingestionJob.update({
      where: { id },
      data: {
        status: input.status,
        diffSummary: input.diffSummary ?? null,
        errorMessage: input.errorMessage ?? null,
      },
    });

    return this.toDomain(record);
  }

  private toDomain(record: PrismaIngestionJob): IngestionJob {
    return {
      id: record.id,
      source: record.source,
      status: record.status,
      diffSummary: record.diffSummary,
      errorMessage: record.errorMessage,
      runAt: record.runAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
