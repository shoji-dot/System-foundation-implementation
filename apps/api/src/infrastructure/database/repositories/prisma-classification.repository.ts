import { Injectable } from "@nestjs/common";
import type {
  DeviceClassification as PrismaDeviceClassification,
  Jurisdiction as PrismaJurisdiction,
  Prisma,
} from "@prisma/client";

import type {
  Classification,
  ClassificationMappingSummary,
} from "../../../core/domain/classification.entity";
import type {
  ClassificationListFilters,
  ClassificationListResult,
  ClassificationRepository,
} from "../../../core/domain/classification.repository";
import { PrismaService } from "../prisma.service";

type DeviceClassificationWithJurisdiction = PrismaDeviceClassification & {
  jurisdiction: PrismaJurisdiction;
};

/**
 * ClassificationRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * カーソルページネーションは id（UUIDv7、生成順に単調増加）を使ったキーセット方式（regulations一覧と同様）。
 */
@Injectable()
export class PrismaClassificationRepository implements ClassificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: ClassificationListFilters): Promise<ClassificationListResult> {
    const where: Prisma.DeviceClassificationWhereInput = {};

    if (filters.scheme) {
      where.scheme = filters.scheme;
    }
    if (filters.jurisdictionCode) {
      where.jurisdiction = { code: filters.jurisdictionCode };
    }
    if (filters.q) {
      where.OR = [
        { code: { contains: filters.q, mode: "insensitive" } },
        { name: { contains: filters.q, mode: "insensitive" } },
        { definition: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    const records = await this.prisma.deviceClassification.findMany({
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
      items: page.map((record: DeviceClassificationWithJurisdiction) => this.toDomain(record)),
      nextCursor,
    };
  }

  async findMappingsByClassificationId(
    classificationId: string,
  ): Promise<ClassificationMappingSummary[] | null> {
    const exists = await this.prisma.deviceClassification.findUnique({
      where: { id: classificationId },
      select: { id: true },
    });
    if (!exists) {
      return null;
    }

    const records = await this.prisma.classificationMapping.findMany({
      where: { OR: [{ fromId: classificationId }, { toId: classificationId }] },
      include: {
        from: { include: { jurisdiction: true } },
        to: { include: { jurisdiction: true } },
      },
    });

    return records.map((record) => {
      const other = record.fromId === classificationId ? record.to : record.from;
      return {
        id: record.id,
        confidence: record.confidence,
        classification: this.toDomain(other),
      };
    });
  }

  private toDomain(record: DeviceClassificationWithJurisdiction): Classification {
    return {
      id: record.id,
      jurisdiction: { code: record.jurisdiction.code, name: record.jurisdiction.name },
      scheme: record.scheme,
      code: record.code,
      name: record.name,
      class: record.class,
      definition: record.definition,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
