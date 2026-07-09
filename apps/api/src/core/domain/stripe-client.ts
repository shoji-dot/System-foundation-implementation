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
  /** Stripe Webhook側でuserId/organizationId/planを引き当てるためのメタデータ（PR②で使用）。 */
  metadata: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export interface StripeClient {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<StripeCheckoutSession>;
}
