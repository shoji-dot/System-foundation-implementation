import { InjectQueue } from "@nestjs/bullmq";
import type { OnModuleInit } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import { INGESTION_JOB_NAME, INGESTION_QUEUE_NAME } from "./ingestion.constants";

/** デフォルトcron: 毎日18:00 UTC（Railway既定のUTC想定でJST03:00相当）。INGESTION_CRON環境変数で上書き可能。 */
const DEFAULT_CRON_PATTERN = "0 18 * * *";

/**
 * 取込パイプラインの日次cron登録（設計書⑨「cron (Railway Worker, 日次)」）。
 * BullMQのrepeatable jobとして登録する。jobIdを固定するため再起動時に呼び直しても重複登録されない
 * （BullMQ側でrepeat設定込みでupsertされる）。
 */
@Injectable()
export class IngestionScheduler implements OnModuleInit {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(
    @InjectQueue(INGESTION_QUEUE_NAME) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const pattern = this.config.get<string>("INGESTION_CRON") ?? DEFAULT_CRON_PATTERN;

    await this.queue.add(
      INGESTION_JOB_NAME,
      {},
      {
        jobId: INGESTION_JOB_NAME,
        repeat: { pattern },
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`取込パイプラインの日次cronを登録しました（pattern: ${pattern}）`);
  }
}
