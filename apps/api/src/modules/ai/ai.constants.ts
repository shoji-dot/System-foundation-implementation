/** 埋め込みバックフィル用BullMQキュー名（設計書⑥ RAGパイプライン準備、Worker cron）。 */
export const EMBEDDING_BACKFILL_QUEUE_NAME = "embedding-backfill";

/** 定期cronで登録するジョブ名。repeatable jobのjobIdとしても使い重複登録を防ぐ。 */
export const EMBEDDING_BACKFILL_JOB_NAME = "run-embedding-backfill";
