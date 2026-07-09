import { z } from "zod";

import { planSchema } from "./roles";

/**
 * Checkout対象プラン（PRO/BUSINESSのみ、設計変更書⑥）。FREEは無料、ENTERPRISEは請求書払いのため
 * Stripe Checkoutの対象外（お問い合わせ対応）。apps/api の PurchasablePlan と値を一致させる。
 */
export const PURCHASABLE_PLANS = ["PRO", "BUSINESS"] as const;
export type PurchasablePlan = (typeof PURCHASABLE_PLANS)[number];
export const purchasablePlanSchema = z.enum(PURCHASABLE_PLANS);

/** 課金周期（設計変更書⑥「Pro (月/年)」準拠）。 */
export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export const billingIntervalSchema = z.enum(BILLING_INTERVALS);

/**
 * POST /api/v1/billing/checkout リクエスト（設計変更書③、S27）。
 * organizationIdはBUSINESS課金時のみ指定（ORG_ADMIN限定、設計変更書⑥「席課金」）。
 */
export const createCheckoutSessionRequestSchema = z.object({
  plan: purchasablePlanSchema,
  interval: billingIntervalSchema,
  organizationId: z.string().uuid().optional(),
});
export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionRequestSchema>;

/** Checkout Session発行応答。フロントはurlへリダイレクトするのみ（設計変更書⑤S27）。 */
export const checkoutSessionResponseSchema = z.object({
  url: z.string().url(),
});
export type CheckoutSessionResponse = z.infer<typeof checkoutSessionResponseSchema>;

/**
 * POST /api/v1/billing/portal リクエスト（設計変更書③、S27）。
 * organizationIdはBUSINESS組織の請求ポータルを開く場合のみ指定（ORG_ADMIN限定、checkoutと同じ方針）。
 */
export const createPortalSessionRequestSchema = z.object({
  organizationId: z.string().uuid().optional(),
});
export type CreatePortalSessionRequest = z.infer<typeof createPortalSessionRequestSchema>;

/** Customer Portal Session発行応答。フロントはurlへリダイレクトするのみ（設計変更書⑤S27）。 */
export const portalSessionResponseSchema = z.object({
  url: z.string().url(),
});
export type PortalSessionResponse = z.infer<typeof portalSessionResponseSchema>;

/** Subscription.status語彙（Stripe Subscription.statusと一致、apps/api BillingSubscriptionStatusと同期）。 */
export const BILLING_SUBSCRIPTION_STATUSES = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "UNPAID",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
  "PAUSED",
] as const;
export const billingSubscriptionStatusSchema = z.enum(BILLING_SUBSCRIPTION_STATUSES);

/** Subscription.source（stripe課金 or admin手動付与、設計変更書⑥「社内利用（無償フル機能）」）。 */
export const BILLING_SUBSCRIPTION_SOURCES = ["STRIPE", "COMPLIMENTARY"] as const;
export const billingSubscriptionSourceSchema = z.enum(BILLING_SUBSCRIPTION_SOURCES);

/**
 * PUT /api/v1/admin/subscriptions/:id/complimentary リクエストボディ（設計変更書⑥「社内利用（無償フル機能）」、
 * Phase7 7-1 PR④）。organizationIdは組織タグとして任意指定（社内の個人アカウントへの単体付与も許容するため）。
 * FREEへの付与は無意味なため（0円プランに"complimentary"の概念が無い）usecase側で拒否する。
 */
export const grantComplimentarySubscriptionRequestSchema = z.object({
  organizationId: z.string().uuid().optional(),
  plan: planSchema,
});
export type GrantComplimentarySubscriptionRequest = z.infer<
  typeof grantComplimentarySubscriptionRequestSchema
>;

/**
 * 課金Subscriptionの応答（admin向けcomplimentary付与/失効、Phase7 7-1 PR④）。
 * `subscriptionResponseSchema`という名称は updates.ts の更新通知購読(UpdateSubscription)側が
 * 既に使用しているため衝突を避け、billingSubscriptionResponseSchemaとする
 * （users.billingSubscriptionsリレーションと同じ命名衝突回避方針）。
 */
export const billingSubscriptionResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  plan: planSchema,
  status: billingSubscriptionStatusSchema,
  source: billingSubscriptionSourceSchema,
  currentPeriodEnd: z.string().datetime().nullable(),
  seats: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type BillingSubscriptionResponse = z.infer<typeof billingSubscriptionResponseSchema>;
