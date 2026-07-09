/**
 * Stripe REST APIのポート（設計書③、domain側に定義しinfrastructureで実装、Repository Patternと同じ方針）。
 * OpenAiChatCompletionProvider同様、公式SDK(npm stripe)は導入せずfetchで直接REST APIを呼ぶ
 * （依存最小化、設計書のAI連携実装方針に合わせる）。
 */
export const STRIPE_CLIENT = Symbol("STRIPE_CLIENT");

export interface CreateCheckoutSessionInput {
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  /** Stripe Webhook側でuserId/organizationId/planを引き当てるためのメタデータ。 */
  metadata: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

/** Stripe Webhookイベントの共通エンベロープ（型はイベント種別ごとにusecase側で狭める）。 */
export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export interface StripeClient {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<StripeCheckoutSession>;
  /**
   * Webhookペイロードの署名検証+パースを行う（設計変更書③ POST /billing/webhook「署名検証」）。
   * 署名不正・期限切れの場合は例外を投げる（呼び出し側でBadRequestへマッピングする）。
   */
  constructEvent(payload: Buffer, signatureHeader: string): StripeEvent;
}
