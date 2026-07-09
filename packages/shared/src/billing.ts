import { z } from "zod";

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
