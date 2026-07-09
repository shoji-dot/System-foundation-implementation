import { Injectable } from "@nestjs/common";

import type {
  CreateCheckoutSessionInput,
  CreatePortalSessionInput,
  StripeCheckoutSession,
  StripeClient,
  StripeEvent,
  StripePortalSession,
} from "../../../core/domain/stripe-client";

import { verifyStripeSignature } from "./stripe-webhook-signature";

interface StripeCheckoutSessionResponse {
  id: string;
  url: string | null;
}

/**
 * StripeClientのfetchベース実装（設計書③ infrastructure/external、OpenAiChatCompletionProviderと同方針）。
 * Stripe REST APIはapplication/x-www-form-urlencodedのネスト表記（line_items[0][price]等）を要求する。
 * Stripe-Versionを明示固定し、Stripe側のデフォルトAPIバージョン変更による意図しない破壊的変更を防ぐ
 * （2025-03-31以降、Subscription.current_period_endはSubscriptionItem側に移動済み、webhook側で前提とする）。
 */
@Injectable()
export class StripeRestClient implements StripeClient {
  private static readonly API_URL = "https://api.stripe.com/v1";
  private static readonly API_VERSION = "2025-03-31.basil";

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
      // Webhook側(customer.subscription.*)はsubscriptionオブジェクトのmetadataを参照するため、
      // subscription_dataにも同じメタデータを複製する（Checkout Session自体のmetadataとは別物）。
      body.set(`subscription_data[metadata][${key}]`, value);
    }

    const response = await fetch(`${StripeRestClient.API_URL}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": StripeRestClient.API_VERSION,
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

  async createPortalSession(input: CreatePortalSessionInput): Promise<StripePortalSession> {
    const secretKey = this.getSecretKey();

    const body = new URLSearchParams();
    body.set("customer", input.customerId);
    body.set("return_url", input.returnUrl);

    const response = await fetch(`${StripeRestClient.API_URL}/billing_portal/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": StripeRestClient.API_VERSION,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Stripe Customer Portal Session作成に失敗しました: ${response.status} ${errorBody}`,
      );
    }

    const json = (await response.json()) as { url: string };
    return { url: json.url };
  }

  constructEvent(payload: Buffer, signatureHeader: string): StripeEvent {
    const webhookSecret = this.getWebhookSecret();
    verifyStripeSignature(payload, signatureHeader, webhookSecret);

    return JSON.parse(payload.toString("utf8")) as StripeEvent;
  }

  private getSecretKey(): string {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY が設定されていません。");
    }
    return secretKey;
  }

  private getWebhookSecret(): string {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET が設定されていません。");
    }
    return webhookSecret;
  }
}
