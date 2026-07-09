import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";

import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import { BILLING_SUBSCRIPTION_REPOSITORY } from "../domain/billing-subscription.repository";
import type { MembershipRepository } from "../domain/membership.repository";
import { MEMBERSHIP_REPOSITORY } from "../domain/membership.repository";
import type { StripeClient, StripePortalSession } from "../domain/stripe-client";
import { STRIPE_CLIENT } from "../domain/stripe-client";

export interface CreatePortalSessionInput {
  userId: string;
  /** 指定時は組織（BUSINESS）の請求ポータルを開く。ORG_ADMINのみ許可（設計変更書⑥）。 */
  organizationId?: string;
}

/**
 * POST /api/v1/billing/portal（設計変更書③、S27、Phase7 7-1 PR③）。
 * Stripeで契約中のユーザー/組織自身がプラン変更・請求書確認・支払方法変更を行える
 * Customer Portal のセッションURLを発行する。Stripeでの契約実績（stripeCustomerId）が
 * 無い場合（FREEのまま、またはCOMPLIMENTARY付与のみ）は404を返す。
 */
@Injectable()
export class CreatePortalSessionUsecase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: StripeClient,
    @Inject(BILLING_SUBSCRIPTION_REPOSITORY)
    private readonly billingSubscriptionRepository: BillingSubscriptionRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(input: CreatePortalSessionInput): Promise<StripePortalSession> {
    if (input.organizationId) {
      await this.assertOrganizationAdmin(input.userId, input.organizationId);
    }

    const stripeCustomerId = await this.billingSubscriptionRepository.findStripeCustomerId({
      userId: input.userId,
      organizationId: input.organizationId ?? null,
    });

    if (!stripeCustomerId) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Not Found",
          status: HttpStatus.NOT_FOUND,
          detail: "Stripeでのご契約が見つかりません。プランのご契約はCheckoutからお願いします。",
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.stripeClient.createPortalSession({
      customerId: stripeCustomerId,
      returnUrl: `${this.getWebAppUrl()}/account/billing`,
    });
  }

  private async assertOrganizationAdmin(userId: string, organizationId: string): Promise<void> {
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
