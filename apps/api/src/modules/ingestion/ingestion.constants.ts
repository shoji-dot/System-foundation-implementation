/** 取込パイプライン用BullMQキュー名（設計書⑨「cron (Railway Worker, 日次)」）。 */
export const INGESTION_QUEUE_NAME = "ingestion";

/** 日次cronで登録するジョブ名。repeatable jobのjobIdとしても使い重複登録を防ぐ。 */
export const INGESTION_JOB_NAME = "run-ingestion";
