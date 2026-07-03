import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { PrismaModule } from "../infrastructure/database/prisma.module";
import { BullmqModule } from "../infrastructure/queue/bullmq.module";
import { RedisModule } from "../infrastructure/queue/redis.module";

/**
 * Worker プロセスのエントリポイント（Railway 2サービス目, 設計書①③⑨）。
 * Phase 0 では Redis/DB 接続のみ確認する。実際のジョブプロセッサ（法規制情報クローラ等）は
 * Phase 4「更新基盤」で ingestion モジュールとともに追加する。
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env.local", ".env"] }),
    PrismaModule,
    RedisModule,
    BullmqModule,
  ],
})
class WorkerModule {}

async function bootstrap() {
  const logger = new Logger("Worker");
  const app = await NestFactory.createApplicationContext(WorkerModule);
  logger.log("worker process started (Redis/DB connections ready)");

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

void bootstrap();
