import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { INGESTION_JOB_REPOSITORY } from "../../core/domain/ingestion-job.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../../core/domain/regulation-ingestion.repository";
import { REGULATORY_SOURCE } from "../../core/domain/regulatory-source";
import { RunIngestionJobUsecase } from "../../core/usecases/run-ingestion-job.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaIngestionJobRepository } from "../../infrastructure/database/repositories/prisma-ingestion-job.repository";
import { PrismaRegulationIngestionRepository } from "../../infrastructure/database/repositories/prisma-regulation-ingestion.repository";
import { PmdaRegulatorySource } from "../../infrastructure/external/regulatory-sources/pmda.regulatory-source";

import { INGESTION_QUEUE_NAME } from "./ingestion.constants";
import { IngestionProcessor } from "./ingestion.processor";
import { IngestionScheduler } from "./ingestion.scheduler";

/**
 * 薬事情報更新パイプラインモジュール（設計書③ modules/ingestion、⑨）。
 * Worker プロセス（apps/api/src/worker/main.ts）にのみ組み込む。HTTP APIは公開しない
 * （手動実行トリガー等が必要になった場合はレビューUI(S20)実装時に別途追加する）。
 * MVPはJPのみ稼働のためRegulatorySourceはPmdaRegulatorySource固定
 * （国追加時はREGULATORY_SOURCEを複数化 or Adapterレジストリ化を検討、設計書⑨「国追加=Adapter追加のみ」）。
 */
@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: INGESTION_QUEUE_NAME })],
  providers: [
    RunIngestionJobUsecase,
    IngestionProcessor,
    IngestionScheduler,
    { provide: REGULATORY_SOURCE, useClass: PmdaRegulatorySource },
    { provide: INGESTION_JOB_REPOSITORY, useClass: PrismaIngestionJobRepository },
    { provide: REGULATION_INGESTION_REPOSITORY, useClass: PrismaRegulationIngestionRepository },
  ],
})
export class IngestionModule {}
