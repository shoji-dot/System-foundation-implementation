import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

/**
 * BullMQ ジョブキュー基盤（設計書①③⑨: クローラ・AI処理等の非同期化）。
 * 個別キュー登録 (ingestion, notifications 等) は各モジュール実装時に追加する。
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>("REDIS_URL") ?? "redis://localhost:6379",
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class BullmqModule {}
