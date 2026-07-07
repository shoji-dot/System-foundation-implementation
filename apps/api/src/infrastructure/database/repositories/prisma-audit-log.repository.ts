import { Injectable } from "@nestjs/common";
import type { AuditLog as PrismaAuditLog } from "@prisma/client";

import type { AuditLog } from "../../../core/domain/audit-log.entity";
import type {
  AuditLogRepository,
  CreateAuditLogInput,
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
