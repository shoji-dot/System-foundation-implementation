import type { Plan } from "./user.entity";

/** Stripe Checkoutの課金周期（設計変更書⑥「Pro (月/年)」準拠）。 */
export type BillingInterval = "month" | "year";

/** Checkout対象となるプラン（FREEは無料、ENTERPRISEは請求書払いのため対象外、設計変更書⑥）。 */
export type PurchasablePlan = Extract<Plan, "PRO" | "BUSINESS">;

export function isPurchasablePlan(plan: Plan): plan is PurchasablePlan {
  return plan === "PRO" || plan === "BUSINESS";
}

/**
 * プラン×課金周期→Stripe Price IDの対応環境変数キー。
 * Price ID自体はStripeダッシュボードで発行しRailway/ローカル.envに設定する（設計変更書⑦ 7-1）。
 */
const PRICE_ID_ENV_KEYS: Record<PurchasablePlan, Record<BillingInterval, string>> = {
  PRO: { month: "STRIPE_PRICE_PRO_MONTHLY", year: "STRIPE_PRICE_PRO_YEARLY" },
  BUSINESS: { month: "STRIPE_PRICE_BUSINESS_MONTHLY", year: "STRIPE_PRICE_BUSINESS_YEARLY" },
};

/** 環境変数からStripe Price IDを解決する。未設定時は起動時ではなくリクエスト時に気付けるよう例外を投げる。 */
export function resolveStripePriceId(plan: PurchasablePlan, interval: BillingInterval): string {
  const envKey = PRICE_ID_ENV_KEYS[plan][interval];
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`${envKey} が設定されていません。`);
  }
  return priceId;
}
