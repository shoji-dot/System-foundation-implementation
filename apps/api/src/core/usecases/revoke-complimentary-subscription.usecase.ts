import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import { BILLING_SUBSCRIPTION_REPOSITORY } from "../domain/billing-subscription.repository";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface RevokeComplimentarySubscriptionInput {
  userId: string;
}

/**
 * DELETE /api/v1/admin/subscriptions/:id/complimentary（設計変更書⑥、Phase7 7-1 PR④、ADMIN限定）。
 * complimentary付与をSubscription.status=CANCELEDへ失効し、users.planをFREEへ戻す。
 *
 * 既知の制約（技術的負債）: 対象ユーザーがCOMPLIMENTARYと同時にSTRIPE課金も有している場合でも
 * 一律FREEへ戻す（複数Subscriptionの中から有効なSTRIPE分を選び直す処理は未実装）。
 * 社内ドッグフーディング用途（Stripe課金と併用しない前提）では実害がないため許容し、
 * 実際に問題化した場合に対応する（YAGNI）。
 */
@Injectable()
export class RevokeComplimentarySubscriptionUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(BILLING_SUBSCRIPTION_REPOSITORY)
    private readonly billingSubscriptionRepository: BillingSubscriptionRepository,
  ) {}

  async execute(input: RevokeComplimentarySubscriptionInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException("指定されたユーザーが見つかりません。");
    }

    const revoked = await this.billingSubscriptionRepository.revokeComplimentary(input.userId);
    if (!revoked) {
      throw new NotFoundException("有効なcomplimentary付与が見つかりません。");
    }

    await this.userRepository.updatePlan(input.userId, "FREE");
  }
}
