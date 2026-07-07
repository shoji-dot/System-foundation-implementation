import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { BackfillRegulationSectionEmbeddingsUsecase } from "../../core/usecases/backfill-regulation-section-embeddings.usecase";

import { EMBEDDING_BACKFILL_QUEUE_NAME } from "./ai.constants";

/** 1回のジョブ実行で処理する最大セクション数（OpenAI APIのレート制限・ジョブタイムアウト対策）。 */
const BATCH_SIZE = 50;

/**
 * 埋め込みバックフィルのBullMQジョブ処理（設計書⑥ RAGパイプライン準備、Worker cron）。
 * 実行本体はBackfillRegulationSectionEmbeddingsUsecaseに委譲する。未処理分が残る場合は
 * 次回cron（EmbeddingBackfillScheduler）で継続処理される。
 */
@Processor(EMBEDDING_BACKFILL_QUEUE_NAME)
export class EmbeddingBackfillProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingBackfillProcessor.name);

  constructor(private readonly backfillUsecase: BackfillRegulationSectionEmbeddingsUsecase) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`埋め込みバックフィルジョブを開始します（jobId: ${job.id}）`);
    const result = await this.backfillUsecase.execute(BATCH_SIZE);
    this.logger.log(
      `埋め込みバックフィルジョブが完了しました（processed: ${result.processedCount}, failed: ${result.failedCount}）`,
    );
  }
}
