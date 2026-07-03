import { Controller, Get } from "@nestjs/common";

import { healthResponseSchema } from "@yakuji/shared";

/**
 * 起動確認用ヘルスチェック（Phase 0）。
 * Railway ヘルスチェック / ローカル動作確認の対象。
 */
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return healthResponseSchema.parse({
      status: "ok" as const,
      service: "api",
      timestamp: new Date().toISOString(),
    });
  }
}
