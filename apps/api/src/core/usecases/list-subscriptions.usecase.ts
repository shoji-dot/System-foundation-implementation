import { Inject, Injectable } from "@nestjs/common";

import type { UpdateSubscription } from "../domain/update-subscription.entity";
import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../domain/update-subscription.repository";

/**
 * 購読一覧取得ユースケース（設計書⑤に明記は無いがS18「既存購読の一覧」向け、ユーザー承認済みで追加）。
 * ログイン中のユーザー自身の購読のみを対象とする。
 */
@Injectable()
export class ListSubscriptionsUsecase {
  constructor(
    @Inject(UPDATE_SUBSCRIPTION_REPOSITORY)
    private readonly updateSubscriptionRepository: UpdateSubscriptionRepository,
  ) {}

  async execute(userId: string): Promise<UpdateSubscription[]> {
    return this.updateSubscriptionRepository.findManyForUser(userId);
  }
}
