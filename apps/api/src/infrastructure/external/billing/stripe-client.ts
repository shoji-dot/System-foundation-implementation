import { Injectable } from "@nestjs/common";

import type {
  CreateCheckoutSessionInput,
  StripeCheckoutSession,
  StripeClient,
} from "../../../core/domain/stripe-client";

interface StripeCheckoutSessionResponse {
  id: string;
  url: string | null;
}

/**
 * StripeClientのfetchベース実装（設計書③ infrastructure/external、OpenAiChatCompletionProviderと同方針）。
 * Stripe REST APIはapplication/x-www-form-urlencodedのネスト表記（line_items[0][price]等）を要求する。
 */
@Injectable()
export class StripeRestClient implements StripeClient {
  private static readonly API_URL = "https://api.stripe.com/v1";

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<StripeCheckoutSession> {
    const secretKey = this.getSecretKey();

    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("customer_email", input.customerEmail);
    body.set("line_items[0][price]", input.priceId);
    body.set("line_items[0][quantity]", "1");
    body.set("success_url", input.successUrl);
    body.set("cancel_url", input.cancelUrl);
    for (const [key, value] of Object.entries(input.metadata)) {
      body.set(`metadata[${key}]`, value);
      // Webhook側(checkout.session.completed)はsubscriptionオブジェクトのmetadataを参照するため、
      // subscription_dataにも同じメタデータを複製する（Checkout Session自体のmetadataとは別物）。
      body.set(`subscription_data[metadata][${key}]`, value);
    }

    const response = await fetch(`${StripeRestClient.API_URL}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Stripe Checkout Session作成に失敗しました: ${response.status} ${errorBody}`);
    }

    const json = (await response.json()) as StripeCheckoutSessionResponse;
    if (!json.url) {
      throw new Error("Stripeから有効なCheckout URLが返却されませんでした。");
    }

    return { id: json.id, url: json.url };
  }

  private getSecretKey(): string {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY が設定されていません。");
    }
    return secretKey;
  }
}
