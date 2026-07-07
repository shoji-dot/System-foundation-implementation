import { InjectQueue } from "@nestjs/bullmq";
import type { OnModuleInit } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import { EMBEDDING_BACKFILL_JOB_NAME, EMBEDDING_BACKFILL_QUEUE_NAME } from "./ai.constants";

/** デフォルトcron: 5分ごと。未処理セクションが無くなるまで自然に繰り返される（1回50件処理、冪等）。 */
const DEFAULT_CRON_PATTERN = "*/5 * * * *";

/**
 * 埋め込みバックフィルの定期cron登録（設計書⑥ RAGパイプライン準備）。
 * IngestionSchedulerと同様、BullMQのrepeatable jobとして登録する（jobId固定で重複登録を防ぐ）。
 */
@Injectable()
export class EmbeddingBackfillScheduler implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingBackfillScheduler.name);

  constructor(
    @InjectQueue(EMBEDDING_BACKFILL_QUEUE_NAME) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const pattern = this.config.get<string>("EMBEDDING_BACKFILL_CRON") ?? DEFAULT_CRON_PATTERN;

    await this.queue.add(
      EMBEDDING_BACKFILL_JOB_NAME,
      {},
      {
        jobId: EMBEDDING_BACKFILL_JOB_NAME,
        repeat: { pattern },
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`埋め込みバックフィルの定期cronを登録しました（pattern: ${pattern}）`);
  }
}
