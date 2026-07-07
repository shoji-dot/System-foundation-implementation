import type { Plan } from "./user.entity";

/**
 * ポートはインターフェースを domain 側に定義する（設計書③、DIP）。実装は infrastructure/external/cache 配下
 * （RedisAiChatQuotaLimiter）。設計書⑥「コスト制御: 無料プランは日次回数制限（エンタイトルメントで制御）」に対応する。
 * ユーザー承認済み方針: FREEプランのみ日次上限（10回/日、UTC日付境界でリセット）を課し、PRO/ENTERPRISEは無制限。
 */
export const AI_CHAT_QUOTA_LIMITER = Symbol("AI_CHAT_QUOTA_LIMITER");

export interface AiChatQuotaResult {
  allowed: boolean;
  /** 無制限プランの場合は null。 */
  limit: number | null;
  /** 無制限プランの場合は null。 */
  remaining: number | null;
}

export interface AiChatQuotaLimiter {
  /** 1回分の利用枠を消費し、消費後の許可可否・残数を返す（設計書④ users.plan によるエンタイトルメント判定）。 */
  consume(userId: string, plan: Plan): Promise<AiChatQuotaResult>;
}
