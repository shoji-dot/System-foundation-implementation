import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";

import type { BillingInterval, PurchasablePlan } from "../domain/billing-plan";
import { isPurchasablePlan, resolveStripePriceId } from "../domain/billing-plan";
import type { MembershipRepository } from "../domain/membership.repository";
import { MEMBERSHIP_REPOSITORY } from "../domain/membership.repository";
import type { StripeCheckoutSession, StripeClient } from "../domain/stripe-client";
import { STRIPE_CLIENT } from "../domain/stripe-client";
import type { Plan } from "../domain/user.entity";

export interface CreateCheckoutSessionInput {
  userId: string;
  email: string;
  plan: Plan;
  interval: BillingInterval;
  organizationId?: string;
}

/**
 * POST /api/v1/billing/checkout（設計変更書③、S27、Phase7 7-1 PR①）。
 * PROは個人課金（organizationId指定不可）、BUSINESSは組織課金（ORG_ADMINのみ・席課金、設計変更書⑥）。
 * FREE/ENTERPRISEはCheckout対象外（ENTERPRISEは請求書払い）。
 * 実際のSubscriptionレコード作成はStripe Webhook（checkout.session.completed、PR②）側で行う。
 * Checkout未完了のセッションをDBへ先行して残さないことで、途中離脱時に不整合なレコードが残らない。
 */
@Injectable()
export class CreateCheckoutSessionUsecase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: StripeClient,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(input: CreateCheckoutSessionInput): Promise<StripeCheckoutSession> {
    if (!isPurchasablePlan(input.plan)) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Bad Request",
          status: HttpStatus.BAD_REQUEST,
          detail:
            "FREEは課金不要、ENTERPRISEは請求書払いのためCheckoutの対象外です（お問い合わせください）。",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.assertOrganizationEligibility(input.plan, input.userId, input.organizationId);

    const priceId = resolveStripePriceId(input.plan, input.interval);
    const webAppUrl = this.getWebAppUrl();

    return this.stripeClient.createCheckoutSession({
      customerEmail: input.email,
      priceId,
      successUrl: `${webAppUrl}/account/billing?checkout=success`,
      cancelUrl: `${webAppUrl}/account/billing?checkout=canceled`,
      metadata: {
        userId: input.userId,
        plan: input.plan,
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      },
    });
  }

  private async assertOrganizationEligibility(
    plan: PurchasablePlan,
    userId: string,
    organizationId?: string,
  ): Promise<void> {
    if (plan === "PRO") {
      if (organizationId) {
        throw new HttpException(
          {
            type: "about:blank",
            title: "Bad Request",
            status: HttpStatus.BAD_REQUEST,
            detail: "PROプランは個人課金のため組織を指定できません。",
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      return;
    }

    if (!organizationId) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Bad Request",
          status: HttpStatus.BAD_REQUEST,
          detail: "BUSINESSプランには組織の指定が必要です。",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const memberships = await this.membershipRepository.findManyForUser(userId);
    const membership = memberships.find((item) => item.organizationId === organizationId);
    if (!membership || membership.role !== "ORG_ADMIN") {
      throw new ForbiddenException("この組織の請求を変更する権限がありません。");
    }
  }

  private getWebAppUrl(): string {
    const webAppUrl = process.env.WEB_APP_URL;
    if (!webAppUrl) {
      throw new Error("WEB_APP_URL が設定されていません。");
    }
    return webAppUrl;
  }
}
