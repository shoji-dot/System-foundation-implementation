import { Controller, Get, Inject } from "@nestjs/common";
import { healthResponseSchema } from "@yakuji/shared";
import type Redis from "ioredis";

import { PrismaService } from "../../infrastructure/database/prisma.service";
import { REDIS_CLIENT } from "../../infrastructure/queue/redis.module";

/**
 * 起動確認用ヘルスチェック（Phase 0）。
 * Railway ヘルスチェック / ローカル動作確認の対象。
 */
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  check() {
    return healthResponseSchema.parse({
      status: "ok" as const,
      service: "api",
      timestamp: new Date().toISOString(),
    });
  }

  @Get("db")
  async checkDb() {
    await this.prisma.$queryRaw`SELECT 1`;
    return healthResponseSchema.parse({
      status: "ok" as const,
      service: "api-db",
      timestamp: new Date().toISOString(),
    });
  }

  @Get("redis")
  async checkRedis() {
    await this.redis.ping();
    return healthResponseSchema.parse({
      status: "ok" as const,
      service: "api-redis",
      timestamp: new Date().toISOString(),
    });
  }
}
