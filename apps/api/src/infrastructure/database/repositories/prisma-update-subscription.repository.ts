import { Injectable } from "@nestjs/common";
import type {
  Jurisdiction as PrismaJurisdiction,
  UpdateSubscription as PrismaUpdateSubscription,
} from "@prisma/client";

import type { UpdateSubscription } from "../../../core/domain/update-subscription.entity";
import type {
  CreateUpdateSubscriptionInput,
  FindMatchingSubscriptionUserIdsInput,
  UpdateSubscriptionRepository,
} from "../../../core/domain/update-subscription.repository";
import { PrismaService } from "../prisma.service";

type UpdateSubscriptionWithJurisdiction = PrismaUpdateSubscription & {
  jurisdiction: PrismaJurisdiction | null;
};

/**
 * UpdateSubscriptionRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * jurisdictionId/regulationTypeがnullable のためDBの複合UNIQUE制約が使えず（Postgresの複合UNIQUEは
 * NULLを別値として扱い重複を検知できない）、重複確認はアプリ層（existsForUser）で行う。
 */
@Injectable()
export class PrismaUpdateSubscriptionRepository implements UpdateSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsForUser(input: CreateUpdateSubscriptionInput): Promise<boolean> {
    const count = await this.prisma.updateSubscription.count({
      where: {
        userId: input.userId,
        ...(input.jurisdictionCode
          ? { jurisdiction: { code: input.jurisdictionCode } }
          : { jurisdictionId: null }),
        regulationType: input.regulationType ?? null,
      },
    });

    return count > 0;
  }

  async create(input: CreateUpdateSubscriptionInput): Promise<UpdateSubscription> {
    const record = await this.prisma.updateSubscription.create({
      // userIdのみscalarでjurisdictionだけconnectを混在させるとPrismaのChecked/Unchecked XOR型に
      // 合致しないため、両リレーションともconnect形式（Checked）に統一する。
      data: {
        user: { connect: { id: input.userId } },
        regulationType: input.regulationType,
        frequency: input.frequency,
        // Jurisdiction.codeが@uniqueのため、事前にidを引かずcodeで直接connectできる。
        jurisdiction: input.jurisdictionCode
          ? { connect: { code: input.jurisdictionCode } }
          : undefined,
      },
      include: { jurisdiction: true },
    });

    return this.toDomain(record);
  }

  async findMatchingUserIds(input: FindMatchingSubscriptionUserIdsInput): Promise<string[]> {
    const subscriptions = await this.prisma.updateSubscription.findMany({
      where: {
        AND: [
          { OR: [{ jurisdictionId: null }, { jurisdiction: { code: input.jurisdictionCode } }] },
          { OR: [{ regulationType: null }, { regulationType: input.regulationType }] },
        ],
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    return subscriptions.map((subscription) => subscription.userId);
  }

  async findManyForUser(userId: string): Promise<UpdateSubscription[]> {
    const records = await this.prisma.updateSubscription.findMany({
      where: { userId },
      include: { jurisdiction: true },
      // idはUUIDv7で生成順に単調増加するため、昇順で作成順表示になる。
      orderBy: { id: "asc" },
    });

    return records.map((record) => this.toDomain(record));
  }

  async findById(id: string): Promise<UpdateSubscription | null> {
    const record = await this.prisma.updateSubscription.findUnique({
      where: { id },
      include: { jurisdiction: true },
    });

    return record ? this.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.updateSubscription.delete({ where: { id } });
  }

  private toDomain(record: UpdateSubscriptionWithJurisdiction): UpdateSubscription {
    return {
      id: record.id,
      userId: record.userId,
      jurisdiction: record.jurisdiction
        ? { code: record.jurisdiction.code, name: record.jurisdiction.name }
        : null,
      regulationType: record.regulationType,
      frequency: record.frequency,
      createdAt: record.createdAt,
    };
  }
}
