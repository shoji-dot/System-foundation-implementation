import { Injectable } from "@nestjs/common";
import type { Jurisdiction as PrismaJurisdiction } from "@prisma/client";

import type { Jurisdiction } from "../../../core/domain/jurisdiction.entity";
import type { JurisdictionRepository } from "../../../core/domain/jurisdiction.repository";
import { PrismaService } from "../prisma.service";

/**
 * JurisdictionRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaJurisdictionRepository implements JurisdictionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Jurisdiction[]> {
    const records = await this.prisma.jurisdiction.findMany({
      orderBy: { code: "asc" },
    });
    return records.map((record: PrismaJurisdiction) => this.toDomain(record));
  }

  private toDomain(record: PrismaJurisdiction): Jurisdiction {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      authority: record.authority,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
