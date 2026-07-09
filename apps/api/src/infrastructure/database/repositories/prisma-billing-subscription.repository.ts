import { Injectable } from "@nestjs/common";
import type { Subscription as PrismaBillingSubscription } from "@prisma/client";

import type {
  BillingSubscription,
  BillingSubscriptionStatus,
} from "../../../core/domain/billing-subscription.entity";
import type {
  BillingSubscriptionRepository,
  FindStripeCustomerIdInput,
  UpsertStripeSubscriptionInput,
} from "../../../core/domain/billing-subscription.repository";
import type { Plan } from "../../../core/domain/user.entity";
import { PrismaService } from "../prisma.service";

/**
 * BillingSubscriptionRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * stripeSubscriptionId は schema 上 @unique のため、それをキーにupsertする
 * （create時のみ user/organization をリレーションで連結、update時はスカラー項目のみ更新）。
 */
@Injectable()
export class PrismaBillingSubscriptionRepository implements BillingSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromStripe(input: UpsertStripeSubscriptionInput): Promise<BillingSubscription> {
    const record = await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
      create: {
        user: { connect: { id: input.userId } },
        organization: input.organizationId ? { connect: { id: input.organizationId } } : undefined,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        plan: input.plan,
        status: input.status,
        source: "STRIPE",
        currentPeriodEnd: input.currentPeriodEnd,
        seats: input.seats,
      },
      update: {
        stripeCustomerId: input.stripeCustomerId,
        plan: input.plan,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        seats: input.seats,
      },
    });

    return this.toDomain(record);
  }

  async findStripeCustomerId(input: FindStripeCustomerIdInput): Promise<string | null> {
    const record = await this.prisma.subscription.findFirst({
      where: input.organizationId ? { organizationId: input.organizationId } : { userId: input.userId },
      select: { stripeCustomerId: true },
    });

    return record?.stripeCustomerId ?? null;
  }

  private toDomain(record: PrismaBillingSubscription): BillingSubscription {
    return {
      id: record.id,
      userId: record.userId,
      organizationId: record.organizationId,
      stripeCustomerId: record.stripeCustomerId,
      stripeSubscriptionId: record.stripeSubscriptionId,
      plan: record.plan as Plan,
      status: record.status as BillingSubscriptionStatus,
      source: record.source,
      currentPeriodEnd: record.currentPeriodEnd,
      seats: record.seats,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
