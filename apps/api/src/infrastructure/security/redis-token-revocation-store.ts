import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";

import type { TokenRevocationStore } from "../../core/domain/token-revocation-store";
import { REDIS_CLIENT } from "../queue/redis.module";

/** 設計書①③: キャッシュ用Redisを流用（専用ストア追加不要）。 */
const KEY_PREFIX = "auth:revoked-refresh-jti:";

@Injectable()
export class RedisTokenRevocationStore implements TokenRevocationStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async revoke(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(KEY_PREFIX + jti, "1", "EX", Math.max(ttlSeconds, 1));
  }

  async isRevoked(jti: string): Promise<boolean> {
    const value = await this.redis.get(KEY_PREFIX + jti);
    return value !== null;
  }
}
