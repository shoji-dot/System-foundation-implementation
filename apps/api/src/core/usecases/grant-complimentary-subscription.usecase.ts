import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { BillingSubscription } from "../domain/billing-subscription.entity";
import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import { BILLING_SUBSCRIPTION_REPOSITORY } from "../domain/billing-subscription.repository";
import type { Plan } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface GrantComplimentarySubscriptionInput {
  userId: string;
  organizationId?: string;
  plan: Plan;
}

/**
 * PUT /api/v1/admin/subscriptions/:id/complimentary（設計変更書⑥「社内利用（無償フル機能）」、
 * Phase7 7-1 PR④、ADMIN限定）。Stripeを通さずSubscription(source=COMPLIMENTARY)を付与する
 * （社内ドッグフーディングの前提条件）。
 *
 * エンタイトルメント判定は users.plan（JWTクレーム、plan-entitlements.ts参照）を直接参照する実装
 * のため、Subscriptionレコードの作成だけでは反映されない。admin-users.controllerの
 * PATCH :id/plan と同じ実態としてusers.planも同期する（こちらはSubscription監査レコードも
 * 残る点が異なる）。
 */
@Injectable()
export class GrantComplimentarySubscriptionUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(BILLING_SUBSCRIPTION_REPOSITORY)
    private readonly billingSubscriptionRepository: BillingSubscriptionRepository,
  ) {}

  async execute(input: GrantComplimentarySubscriptionInput): Promise<BillingSubscription> {
    if (input.plan === "FREE") {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Bad Request",
          status: HttpStatus.BAD_REQUEST,
          detail: "FREEプランへのcomplimentary付与はできません。",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException("指定されたユーザーが見つかりません。");
    }

    const subscription = await this.billingSubscriptionRepository.upsertComplimentary({
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      plan: input.plan,
    });

    await this.userRepository.updatePlan(input.userId, input.plan);

    return subscription;
  }
}
