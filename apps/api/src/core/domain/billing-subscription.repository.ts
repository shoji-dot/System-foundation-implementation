import type { BillingSubscription, BillingSubscriptionStatus } from "./billing-subscription.entity";
import type { Plan } from "./user.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaBillingSubscriptionRepository）。
 */
export const BILLING_SUBSCRIPTION_REPOSITORY = Symbol("BILLING_SUBSCRIPTION_REPOSITORY");

export interface UpsertStripeSubscriptionInput {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  userId: string;
  organizationId: string | null;
  plan: Plan;
  status: BillingSubscriptionStatus;
  currentPeriodEnd: Date | null;
  seats: number;
}

export interface FindStripeCustomerIdInput {
  userId: string;
  /** 指定時は組織課金（BUSINESS）として組織側のSubscriptionを検索する（設計変更書⑥）。 */
  organizationId?: string | null;
}

export interface BillingSubscriptionRepository {
  /**
   * Stripe Webhook（customer.subscription.created/updated/deleted）を冪等に反映する
   * （設計変更書③「plan/Subscription同期」）。stripeSubscriptionIdをキーにupsertするため、
   * Stripe側のリトライ配信を受けても重複レコードを作らない。
   */
  upsertFromStripe(input: UpsertStripeSubscriptionInput): Promise<BillingSubscription>;
  /**
   * POST /billing/portal（設計変更書③）用。organizationId指定時は組織のSubscriptionから、
   * 未指定時は個人のSubscriptionから stripeCustomerId を引く。Stripe課金の実績が無い
   * （COMPLIMENTARYのみ、または未契約）場合はnullを返す。
   */
  findStripeCustomerId(input: FindStripeCustomerIdInput): Promise<string | null>;
}
