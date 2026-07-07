import type { AiChatCitation } from "./ai-chat.entity";

/**
 * ポートはインターフェースを domain 側に定義する（設計書③、DIP）。実装は infrastructure/external/cache 配下
 * （RedisAiChatAnswerCache）。設計書⑥「コスト制御: 回答キャッシュ（質問正規化ハッシュ）」に対応する。
 * ユーザー承認済み方針: 質問正規化ハッシュをキーに全ユーザー共有、TTL 24時間。
 */
export const AI_CHAT_ANSWER_CACHE = Symbol("AI_CHAT_ANSWER_CACHE");

export interface CachedAiChatAnswer {
  answer: string;
  citations: AiChatCitation[];
}

export interface AiChatAnswerCache {
  /** cacheKey は呼び出し側（usecase）が質問正規化ハッシュとして生成した値。 */
  get(cacheKey: string): Promise<CachedAiChatAnswer | null>;
  set(cacheKey: string, value: CachedAiChatAnswer): Promise<void>;
}
