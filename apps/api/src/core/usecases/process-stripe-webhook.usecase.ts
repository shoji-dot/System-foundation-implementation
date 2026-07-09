import { Inject, Injectable, Logger } from "@nestjs/common";

import { isPurchasablePlan } from "../domain/billing-plan";
import type { BillingSubscriptionStatus } from "../domain/billing-subscription.entity";
import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import { BILLING_SUBSCRIPTION_REPOSITORY } from "../domain/billing-subscription.repository";
import type { StripeClient, StripeEvent } from "../domain/stripe-client";
import { STRIPE_CLIENT } from "../domain/stripe-client";
import type { Plan } from "../domain/user.entity";

const SYNCED_EVENT_TYPES = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

/** Stripe Subscriptionオブジェクトのうち、同期に必要な部分のみを狭めた形。 */
interface StripeSubscriptionObject {
  id: string;
  customer: string;
  status: string;
  metadata: Record<string, string>;
  items: { data: { quantity: number; current_period_end: number }[] };
}

function isStripeSubscriptionObject(value: unknown): value is StripeSubscriptionObject {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.customer === "string" &&
    typeof candidate.status === "string" &&
    Array.isArray((candidate.items as { data?: unknown })?.data)
  );
}

/** StripeのSubscription.status語彙をそのままBillingSubscriptionStatusとして受理可能かの判定。 */
const SUBSCRIPTION_STATUSES = new Set<BillingSubscriptionStatus>([
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "UNPAID",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
  "PAUSED",
]);

/**
 * POST /api/v1/billing/webhook（設計変更書③、Phase7 7-1 PR②）。
 * customer.subscription.{created,updated,deleted} を購読し、Subscriptionテーブルへ同期する。
 * checkout.session.completedではなくsubscriptionイベント側を採用する理由: 更新・解約時のstatus/
 * 期限変化もこの3種で一貫して追えるため（Checkout完了直後の1回だけでなく、継続的な同期が必要）。
 * metadata（userId/plan/organizationId、PR①のCheckout Session作成時にsubscription_dataへ複製済み）
 * が無い購読（Stripeダッシュボードから手動作成した等）は同期対象外としてスキップする。
 */
@Injectable()
export class ProcessStripeWebhookUsecase {
  private readonly logger = new Logger(ProcessStripeWebhookUsecase.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: StripeClient,
    @Inject(BILLING_SUBSCRIPTION_REPOSITORY)
    private readonly billingSubscriptionRepository: BillingSubscriptionRepository,
  ) {}

  async execute(payload: Buffer, signatureHeader: string): Promise<void> {
    const event = this.stripeClient.constructEvent(payload, signatureHeader);

    if (!SYNCED_EVENT_TYPES.has(event.type)) {
      return;
    }

    await this.syncSubscription(event);
  }

  private async syncSubscription(event: StripeEvent): Promise<void> {
    const subscription = event.data.object;
    if (!isStripeSubscriptionObject(subscription)) {
      this.logger.warn(`Webhook ${event.type} (${event.id}): 想定外のペイロード形状のためスキップ`);
      return;
    }

    const metadata = subscription.metadata ?? {};
    const userId = metadata.userId;
    const plan = metadata.plan as Plan | undefined;
    if (!userId || !plan || !isPurchasablePlan(plan)) {
      this.logger.log(
        `Webhook ${event.type} (${event.id}): metadata(userId/plan)が無いため同期対象外`,
      );
      return;
    }

    const status = subscription.status.toUpperCase() as BillingSubscriptionStatus;
    if (!SUBSCRIPTION_STATUSES.has(status)) {
      this.logger.warn(
        `Webhook ${event.type} (${event.id}): 未知のstatus "${subscription.status}"`,
      );
      return;
    }

    const item = subscription.items.data[0];

    await this.billingSubscriptionRepository.upsertFromStripe({
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      userId,
      organizationId: metadata.organizationId ?? null,
      plan,
      status,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      seats: item?.quantity ?? 1,
    });
  }
}
