import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { INGESTION_JOB_REPOSITORY } from "../../core/domain/ingestion-job.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../../core/domain/regulation-ingestion.repository";
import { REGULATORY_SOURCES } from "../../core/domain/regulatory-source";
import { RunIngestionJobUsecase } from "../../core/usecases/run-ingestion-job.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaIngestionJobRepository } from "../../infrastructure/database/repositories/prisma-ingestion-job.repository";
import { PrismaRegulationIngestionRepository } from "../../infrastructure/database/repositories/prisma-regulation-ingestion.repository";
import { FdaRegulatorySource } from "../../infrastructure/external/regulatory-sources/fda.regulatory-source";
import { MdcgRegulatorySource } from "../../infrastructure/external/regulatory-sources/mdcg.regulatory-source";
import { PmdaRegulatorySource } from "../../infrastructure/external/regulatory-sources/pmda.regulatory-source";

import { INGESTION_QUEUE_NAME } from "./ingestion.constants";
import { IngestionProcessor } from "./ingestion.processor";
import { IngestionScheduler } from "./ingestion.scheduler";

/**
 * 薬事情報更新パイプラインモジュール（設計書③ modules/ingestion、⑨）。
 * Worker プロセス（apps/api/src/worker/main.ts）にのみ組み込む。HTTP APIは公開しない
 * （手動実行トリガー等が必要になった場合はレビューUI(S20)実装時に別途追加する）。
 *
 * 2026-07-08: 複数Adapter対応（US Adapter追加）にあわせ、REGULATORY_SOURCESをuseFactoryで
 * 配列登録するよう変更した（設計書⑨「国追加=Adapter追加のみ」。国追加時はこのファイルの
 * providers/useFactoryにAdapterを1行追加するだけでよい）。
 * 2026-07-08（同日）: FdaRegulatorySource（US、Federal Register API）を追加し、稼働Adapterが
 * PMDA（JP）・FDA（US）の2件になった（設計書⑮ Phase6「多国Adapter追加(US/EUから)」）。
 * 2026-07-08（同日）: MdcgRegulatorySource（EU、MDCGガイダンス一覧）を追加し、JP/US/EUの3件に
 * なった（設計書⑮ Phase6「多国Adapter追加(US/EUから)」完了。EUR-Lex法令本体は別Adapterとして
 * 別途検討、MdcgRegulatorySourceのクラスdocコメント参照）。
 */
@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: INGESTION_QUEUE_NAME })],
  providers: [
    RunIngestionJobUsecase,
    IngestionProcessor,
    IngestionScheduler,
    PmdaRegulatorySource,
    FdaRegulatorySource,
    MdcgRegulatorySource,
    {
      provide: REGULATORY_SOURCES,
      useFactory: (
        pmda: PmdaRegulatorySource,
        fda: FdaRegulatorySource,
        mdcg: MdcgRegulatorySource,
      ) => [pmda, fda, mdcg],
      inject: [PmdaRegulatorySource, FdaRegulatorySource, MdcgRegulatorySource],
    },
    { provide: INGESTION_JOB_REPOSITORY, useClass: PrismaIngestionJobRepository },
    { provide: REGULATION_INGESTION_REPOSITORY, useClass: PrismaRegulationIngestionRepository },
  ],
})
export class IngestionModule {}
