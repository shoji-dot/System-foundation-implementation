import { Injectable } from "@nestjs/common";
import type { AuditLog as PrismaAuditLog } from "@prisma/client";

import type { AuditLog } from "../../../core/domain/audit-log.entity";
import type {
  AuditLogListResult,
  AuditLogRepository,
  CreateAuditLogInput,
  ListAuditLogsFilters,
} from "../../../core/domain/audit-log.repository";
import { PrismaService } from "../prisma.service";

/**
 * AuditLogRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const record = await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        target: input.target,
      },
    });

    return this.toDomain(record);
  }

  async list(filters: ListAuditLogsFilters): Promise<AuditLogListResult> {
    // UUIDv7のidは生成順に単調増加するため、id desc で新しい記録から返す
    // （取込レビュー一覧の listPendingReview と同様のカーソルページネーション方式）。
    const records = await this.prisma.auditLog.findMany({
      orderBy: { id: "desc" },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record) => this.toDomain(record)),
      nextCursor,
    };
  }

  private toDomain(record: PrismaAuditLog): AuditLog {
    return {
      id: record.id,
      actorId: record.actorId,
      action: record.action,
      target: record.target,
      createdAt: record.createdAt,
    };
  }
}
