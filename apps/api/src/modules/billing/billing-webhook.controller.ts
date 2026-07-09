import type { RawBodyRequest } from "@nestjs/common";
import { BadRequestException, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import type { Request } from "express";

import { ProcessStripeWebhookUsecase } from "../../core/usecases/process-stripe-webhook.usecase";

/**
 * POST /api/v1/billing/webhook（設計変更書③、Phase7 7-1 PR②）。
 * Stripeからの直接呼び出しのためJwtAuthGuardは付けない（署名検証がその代替）。
 * 署名検証に生ボディが必須のため@Body()は使わず、main.tsのrawBody:trueで有効化された
 * request.rawBodyを参照する。
 */
@Controller("billing")
export class BillingWebhookController {
  constructor(private readonly processStripeWebhookUsecase: ProcessStripeWebhookUsecase) {}

  @Post("webhook")
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleWebhook(@Req() request: RawBodyRequest<Request>): Promise<void> {
    const signature = request.headers["stripe-signature"];
    if (!request.rawBody || typeof signature !== "string") {
      throw new BadRequestException("Stripe-Signatureヘッダまたはリクエストボディがありません。");
    }

    try {
      await this.processStripeWebhookUsecase.execute(request.rawBody, signature);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Webhook処理に失敗しました。",
      );
    }
  }
}
