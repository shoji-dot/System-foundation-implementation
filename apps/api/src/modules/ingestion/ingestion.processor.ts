import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { RunIngestionJobUsecase } from "../../core/usecases/run-ingestion-job.usecase";

import { INGESTION_QUEUE_NAME } from "./ingestion.constants";

/**
 * 取込パイプラインのBullMQジョブ処理（設計書⑨「cron (Railway Worker, 日次)」）。
 * 実行本体はRunIngestionJobUsecaseに委譲する。ジョブ自体の再試行はBullMQのattempts設定
 * （IngestionSchedulerで登録）に委ねる（設計書⑨「失敗時リトライ」）。
 */
@Processor(INGESTION_QUEUE_NAME)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly runIngestionJobUsecase: RunIngestionJobUsecase) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`取込ジョブを開始します（jobId: ${job.id}）`);
    const result = await this.runIngestionJobUsecase.execute();
    this.logger.log(
      `取込ジョブが完了しました（status: ${result.status}, diffSummary: ${result.diffSummary ?? "-"}）`,
    );

    if (result.status === "FAILED") {
      // BullMQのattempts/backoffによるリトライ対象とするため例外化する。
      throw new Error(result.errorMessage ?? "取込ジョブが失敗しました。");
    }
  }
}
