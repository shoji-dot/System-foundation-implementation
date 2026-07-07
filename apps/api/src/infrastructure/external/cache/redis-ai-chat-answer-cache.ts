import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";

import type {
  AiChatAnswerCache,
  CachedAiChatAnswer,
} from "../../../core/domain/ai-chat-answer-cache";
import { REDIS_CLIENT } from "../../queue/redis.module";

const KEY_PREFIX = "ai:chat:cache:";
/** ユーザー承認済み: TTL 24時間・全ユーザー共有（質問正規化ハッシュがキー）。 */
const TTL_SECONDS = 24 * 60 * 60;

/**
 * AiChatAnswerCache の Redis 実装（設計書③ infrastructure/external、設計書⑥コスト制御「回答キャッシュ」）。
 */
@Injectable()
export class RedisAiChatAnswerCache implements AiChatAnswerCache {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(cacheKey: string): Promise<CachedAiChatAnswer | null> {
    const value = await this.redis.get(KEY_PREFIX + cacheKey);
    if (!value) {
      return null;
    }

    // JSON往復でDateはISO文字列になるため、citations内のeffectiveFrom/effectiveToをDateへ戻す
    // （JSON.parseはDateを自動復元しないため、素通しするとランタイム型とTypeScript型が食い違う）。
    const parsed = JSON.parse(value) as CachedAiChatAnswer;
    return {
      ...parsed,
      citations: parsed.citations.map((citation) => ({
        ...citation,
        effectiveFrom: new Date(citation.effectiveFrom),
        effectiveTo: citation.effectiveTo ? new Date(citation.effectiveTo) : null,
      })),
    };
  }

  async set(cacheKey: string, value: CachedAiChatAnswer): Promise<void> {
    await this.redis.set(KEY_PREFIX + cacheKey, JSON.stringify(value), "EX", TTL_SECONDS);
  }
}
