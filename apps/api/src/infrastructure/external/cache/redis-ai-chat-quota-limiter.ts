import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";

import type {
  AiChatQuotaLimiter,
  AiChatQuotaResult,
} from "../../../core/domain/ai-chat-quota-limiter";
import type { Plan } from "../../../core/domain/user.entity";
import { REDIS_CLIENT } from "../../queue/redis.module";

const KEY_PREFIX = "ai:chat:quota:";
/** 無料プランの日次上限回数（ユーザー承認済み: 10回/日、UTC日付境界でリセット）。 */
const FREE_PLAN_DAILY_LIMIT = 10;
/** キー自体はUTC日付を含み日ごとに変わるため、TTLは1日分+余裕を持たせるだけでよい。 */
const KEY_TTL_SECONDS = 90_000;

/**
 * AiChatQuotaLimiter の Redis 実装（設計書③ infrastructure/external、設計書⑥コスト制御）。
 * ユーザー承認済み方針: FREEプランのみ日次10回/UTC日付境界でリセット、PRO/ENTERPRISEは無制限（判定自体を行わない）。
 */
@Injectable()
export class RedisAiChatQuotaLimiter implements AiChatQuotaLimiter {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async consume(userId: string, plan: Plan): Promise<AiChatQuotaResult> {
    if (plan !== "FREE") {
      return { allowed: true, limit: null, remaining: null };
    }

    const key = `${KEY_PREFIX}${userId}:${this.currentUtcDateKey()}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, KEY_TTL_SECONDS);
    }

    const remaining = Math.max(FREE_PLAN_DAILY_LIMIT - count, 0);
    return { allowed: count <= FREE_PLAN_DAILY_LIMIT, limit: FREE_PLAN_DAILY_LIMIT, remaining };
  }

  /** UTC日付境界（ユーザー承認済み）でのリセットのためYYYY-MM-DD（UTC）をキーに含める。 */
  private currentUtcDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
