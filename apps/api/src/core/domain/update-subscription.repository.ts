import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationType } from "./regulation.entity";
import type { UpdateFrequency, UpdateSubscription } from "./update-subscription.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaUpdateSubscriptionRepository）。
 */
export const UPDATE_SUBSCRIPTION_REPOSITORY = Symbol("UPDATE_SUBSCRIPTION_REPOSITORY");

export interface CreateUpdateSubscriptionInput {
  userId: string;
  jurisdictionCode?: JurisdictionCode;
  regulationType?: RegulationType;
  frequency: UpdateFrequency;
}

export interface UpdateSubscriptionRepository {
  /**
   * 同一ユーザー・同一jurisdiction・同一regulationTypeの組み合わせが既に存在するか確認する
   * （update_subscriptionsはjurisdiction_id/regulation_typeがnullable のため、DBの複合UNIQUE制約では
   * NULL同士の重複を検知できない。アプリ層で重複防止する）。
   */
  existsForUser(input: CreateUpdateSubscriptionInput): Promise<boolean>;
  create(input: CreateUpdateSubscriptionInput): Promise<UpdateSubscription>;
}
