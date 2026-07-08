import { ConflictException, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import { hasReachedSubscriptionLimit, PLAN_SUBSCRIPTION_LIMITS } from "../domain/plan-entitlements";
import type { RegulationType } from "../domain/regulation.entity";
import type { UpdateFrequency, UpdateSubscription } from "../domain/update-subscription.entity";
import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../domain/update-subscription.repository";
import type { Plan } from "../domain/user.entity";

export interface CreateUpdateSubscriptionInput {
  userId: string;
  plan: Plan;
  jurisdiction?: JurisdictionCode;
  regulationType?: RegulationType;
  frequency: UpdateFrequency;
}

/**
 * 更新通知購読作成ユースケース（設計書⑤ POST /api/v1/subscriptions、S17/S18）。
 * 同一ユーザーが同一条件（jurisdiction×regulationType）で重複購読することを防ぐ。
 * 設計書⑦「エンタイトルメント層: plan→機能フラグ（通知数）」に基づき、
 * プラン別の購読上限（ユーザー承認済み方針: FREE=3, PRO=20, ENTERPRISE=無制限）を超える作成を拒否する。
 */
@Injectable()
export class CreateUpdateSubscriptionUsecase {
  constructor(
    @Inject(UPDATE_SUBSCRIPTION_REPOSITORY)
    private readonly updateSubscriptionRepository: UpdateSubscriptionRepository,
  ) {}

  async execute(input: CreateUpdateSubscriptionInput): Promise<UpdateSubscription> {
    const params = {
      userId: input.userId,
      jurisdictionCode: input.jurisdiction,
      regulationType: input.regulationType,
      frequency: input.frequency,
    };

    const alreadyExists = await this.updateSubscriptionRepository.existsForUser(params);
    if (alreadyExists) {
      throw new ConflictException("指定の条件では既に購読済みです。");
    }

    const currentCount = await this.updateSubscriptionRepository.countForUser(input.userId);
    if (hasReachedSubscriptionLimit(input.plan, currentCount)) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Forbidden",
          status: HttpStatus.FORBIDDEN,
          detail: `現在のプランで作成できる更新通知購読数の上限（${PLAN_SUBSCRIPTION_LIMITS[input.plan]}件）に達しています。プランのアップグレードをご検討ください。`,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return this.updateSubscriptionRepository.create(params);
  }
}
