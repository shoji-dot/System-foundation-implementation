import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import type { RegulatorySource } from "../../core/domain/regulatory-source";
import { REGULATORY_SOURCES } from "../../core/domain/regulatory-source";
import { RunIngestionJobUsecase } from "../../core/usecases/run-ingestion-job.usecase";

import { INGESTION_QUEUE_NAME } from "./ingestion.constants";

/** IngestionSchedulerが登録するジョブのdata形状（設計書⑨、複数Adapter対応）。 */
interface IngestionJobData {
  sourceId: string;
}

/**
 * 取込パイプラインのBullMQジョブ処理（設計書⑨「cron (Railway Worker, 日次)」）。
 * 実行本体はRunIngestionJobUsecaseに委譲する。ジョブ自体の再試行はBullMQのattempts設定
 * （IngestionSchedulerで登録）に委ねる（設計書⑨「失敗時リトライ」）。
 *
 * 2026-07-08: 複数Adapter対応（US Adapter追加）にあわせ、job.data.sourceIdから
 * REGULATORY_SOURCES配列内の対象Adapterを解決してusecaseに渡すよう変更した
 * （IngestionSchedulerがAdapterごとに個別jobを登録するため、1件のジョブは常に1つのAdapterに対応する）。
 */
@Processor(INGESTION_QUEUE_NAME)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly runIngestionJobUsecase: RunIngestionJobUsecase,
    @Inject(REGULATORY_SOURCES) private readonly sources: RegulatorySource[],
  ) {
    super();
  }

  async process(job: Job<IngestionJobData>): Promise<void> {
    const { sourceId } = job.data;
    const source = this.sources.find((candidate) => candidate.sourceId === sourceId);
    if (!source) {
      // IngestionSchedulerが登録済みAdapterのsourceIdでしか job.data を作らないため、
      // 到達した場合はAdapterの登録漏れ等の設定不備。リトライしても解決しないため即失敗させる。
      throw new Error(`未登録のRegulatorySourceです（sourceId: ${sourceId}）`);
    }

    this.logger.log(`取込ジョブを開始します（jobId: ${job.id}, source: ${sourceId}）`);
    const result = await this.runIngestionJobUsecase.execute(source);
    this.logger.log(
      `取込ジョブが完了しました（source: ${sourceId}, status: ${result.status}, diffSummary: ${result.diffSummary ?? "-"}）`,
    );

    if (result.status === "FAILED") {
      // BullMQのattempts/backoffによるリトライ対象とするため例外化する。
      throw new Error(result.errorMessage ?? "取込ジョブが失敗しました。");
    }
  }
}
