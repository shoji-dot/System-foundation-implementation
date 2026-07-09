import type { Plan } from "./user.entity";

/**
 * 課金サブスクリプション・ドメインエンティティ（設計変更書② Subscription 準拠、Phase7 7-1）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * StripeのSubscription.statusと語彙を一致させてある（Prisma SubscriptionStatus enumのコメント参照）。
 */
export type BillingSubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "PAUSED";

export type BillingSubscriptionSource = "STRIPE" | "COMPLIMENTARY";

export interface BillingSubscription {
  id: string;
  userId: string;
  organizationId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: Plan;
  status: BillingSubscriptionStatus;
  source: BillingSubscriptionSource;
  currentPeriodEnd: Date | null;
  seats: number;
  createdAt: Date;
  updatedAt: Date;
}
