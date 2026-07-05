import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { PrismaModule } from "../infrastructure/database/prisma.module";
import { BullmqModule } from "../infrastructure/queue/bullmq.module";
import { RedisModule } from "../infrastructure/queue/redis.module";
import { IngestionModule } from "../modules/ingestion/ingestion.module";

/**
 * Worker プロセスのエントリポイント（Railway 2サービス目, 設計書①③⑨）。
 * IngestionModule（薬事情報更新パイプライン、設計書⑨）の日次cron登録・ジョブ実行を行う。
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env.local", ".env"] }),
    PrismaModule,
    RedisModule,
    BullmqModule,
    IngestionModule,
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
