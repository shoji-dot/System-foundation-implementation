import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationType } from "./regulation.entity";

/**
 * 更新通知の配信頻度（設計書⑤ POST /api/v1/subscriptions、S18「購読国・タイプ・頻度」準拠）。
 */
export const UPDATE_FREQUENCIES = ["REALTIME", "DAILY", "WEEKLY"] as const;
export type UpdateFrequency = (typeof UPDATE_FREQUENCIES)[number];

/**
 * 更新通知購読ドメインエンティティ（設計書⑤ POST /api/v1/subscriptions、S17/S18 準拠）。
 * jurisdiction/regulationTypeがnullの場合はそれぞれ「全国」「全タイプ」を意味する。
 */
export interface UpdateSubscription {
  id: string;
  userId: string;
  jurisdiction: { code: JurisdictionCode; name: string } | null;
  regulationType: RegulationType | null;
  frequency: UpdateFrequency;
  createdAt: Date;
}
