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

export interface BillingSubscriptionRepository {
  /**
   * Stripe Webhook（customer.subscription.created/updated/deleted）を冪等に反映する
   * （設計変更書③「plan/Subscription同期」）。stripeSubscriptionIdをキーにupsertするため、
   * Stripe側のリトライ配信を受けても重複レコードを作らない。
   */
  upsertFromStripe(input: UpsertStripeSubscriptionInput): Promise<BillingSubscription>;
}
