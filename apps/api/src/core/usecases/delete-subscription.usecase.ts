import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../domain/update-subscription.repository";

export interface DeleteSubscriptionInput {
  userId: string;
  subscriptionId: string;
}

/**
 * 購読解除ユースケース（設計書⑤に明記は無いがS18「既存購読の解除」向け、ユーザー承認済みで追加）。
 * 存在しない、または他ユーザーの購読の場合は、存在有無を漏らさないため一律NotFoundExceptionとする
 * （設計書⑦OWASP対応: 認可漏れの情報を返さない）。
 */
@Injectable()
export class DeleteSubscriptionUsecase {
  constructor(
    @Inject(UPDATE_SUBSCRIPTION_REPOSITORY)
    private readonly updateSubscriptionRepository: UpdateSubscriptionRepository,
  ) {}

  async execute(input: DeleteSubscriptionInput): Promise<void> {
    const subscription = await this.updateSubscriptionRepository.findById(input.subscriptionId);
    if (!subscription || subscription.userId !== input.userId) {
      throw new NotFoundException("指定された購読が見つかりません。");
    }

    await this.updateSubscriptionRepository.delete(input.subscriptionId);
  }
}
