import type { Plan } from "./user.entity";

/**
 * プラン別のエンタイトルメント上限（設計書⑦「エンタイトルメント層: plan→機能フラグ（AI回数、プロジェクト数、通知数）」）。
 * AI回数は ai-chat-quota-limiter.ts で別管理（利用頻度に対する日次カウンタのため仕組みが異なる）。
 * こちらは「作成済み総数」に対する静的な上限のため、プラン→上限値の単純なマップとして持つ。
 * ユーザー承認済み方針: プロジェクト数・更新通知購読数ともに FREE=3, PRO=20, ENTERPRISE=無制限（null）。
 */
export const PLAN_PROJECT_LIMITS: Record<Plan, number | null> = {
  FREE: 3,
  PRO: 20,
  // Phase7でBUSINESSを追加する際、上限値が設計変更書に未記載だったためユーザーに個別確認し、
  // PROと同値（20件）に決定（2026-07-09）。
  BUSINESS: 20,
  ENTERPRISE: null,
};

export const PLAN_SUBSCRIPTION_LIMITS: Record<Plan, number | null> = {
  FREE: 3,
  PRO: 20,
  // 上記PLAN_PROJECT_LIMITSと同じ経緯・同じ理由でPROと同値。
  BUSINESS: 20,
  ENTERPRISE: null,
};

/** 現在の作成数が上限に達しているか（＝これ以上作成不可）を判定する共通ロジック。limitがnull（無制限プラン）なら常にfalse。 */
function hasReachedLimit(limit: number | null, currentCount: number): boolean {
  if (limit === null) {
    return false;
  }
  return currentCount >= limit;
}

export function hasReachedProjectLimit(plan: Plan, currentCount: number): boolean {
  return hasReachedLimit(PLAN_PROJECT_LIMITS[plan], currentCount);
}

export function hasReachedSubscriptionLimit(plan: Plan, currentCount: number): boolean {
  return hasReachedLimit(PLAN_SUBSCRIPTION_LIMITS[plan], currentCount);
}
