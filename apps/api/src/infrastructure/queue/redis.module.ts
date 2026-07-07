import type { OnModuleDestroy } from "@nestjs/common";
import { Global, Inject, Injectable, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis from "ioredis";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

/**
 * REDIS_CLIENT（生のioredisインスタンス）自体はNestのライフサイクルフックを持たないため、
 * app.close()時に接続が残り、e2eテストや本番のgraceful shutdown（Railway再デプロイ時）で
 * プロセスが終了しないハングの原因になっていた。本サービスがDIグラフ上で終了フックを持ち、
 * モジュール破棄時に明示的に接続を閉じる。
 */
@Injectable()
class RedisLifecycle implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: IORedis) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

/**
 * Redis 接続（キャッシュ・BullMQジョブキュー共用, 設計書①③準拠）。
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new IORedis(config.get<string>("REDIS_URL") ?? "redis://localhost:6379", {
          maxRetriesPerRequest: null,
        }),
    },
    RedisLifecycle,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
