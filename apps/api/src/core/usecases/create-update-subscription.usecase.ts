import { ConflictException, Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { RegulationType } from "../domain/regulation.entity";
import type { UpdateFrequency, UpdateSubscription } from "../domain/update-subscription.entity";
import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../domain/update-subscription.repository";

export interface CreateUpdateSubscriptionInput {
  userId: string;
  jurisdiction?: JurisdictionCode;
  regulationType?: RegulationType;
  frequency: UpdateFrequency;
}

/**
 * 更新通知購読作成ユースケース（設計書⑤ POST /api/v1/subscriptions、S17/S18）。
 * 同一ユーザーが同一条件（jurisdiction×regulationType）で重複購読することを防ぐ。
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

    return this.updateSubscriptionRepository.create(params);
  }
}
