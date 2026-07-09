import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { CheckoutSessionResponse } from "@yakuji/shared";
import { checkoutSessionResponseSchema } from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateCheckoutSessionUsecase } from "../../core/usecases/create-checkout-session.usecase";

import { CreateCheckoutSessionRequestDto } from "./dto/create-checkout-session-request.dto";

/**
 * 課金モジュール（設計変更書③ billing、S27、Phase7 7-1）。
 * POST /api/v1/billing/checkout: Stripe Checkout Session発行。PRO=個人課金、BUSINESS=組織課金
 * （ORG_ADMIN限定・席課金）。実際のSubscription作成はwebhook（PR②、後続）で行う。
 */
@Controller("billing")
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly createCheckoutSessionUsecase: CreateCheckoutSessionUsecase) {}

  @Post("checkout")
  async checkout(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateCheckoutSessionRequestDto,
  ): Promise<CheckoutSessionResponse> {
    const session = await this.createCheckoutSessionUsecase.execute({
      userId: request.user.userId,
      email: request.user.email,
      plan: body.plan,
      interval: body.interval,
      organizationId: body.organizationId,
    });

    return checkoutSessionResponseSchema.parse({ url: session.url });
  }
}
