import type { IngestionJob, IngestionJobStatus } from "./ingestion-job.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaIngestionJobRepository）。
 */
export const INGESTION_JOB_REPOSITORY = Symbol("INGESTION_JOB_REPOSITORY");

export interface CreateIngestionJobInput {
  source: string;
  status: IngestionJobStatus;
  diffSummary?: string | null;
  errorMessage?: string | null;
  runAt: Date;
}

export interface UpdateIngestionJobInput {
  status: IngestionJobStatus;
  diffSummary?: string | null;
  errorMessage?: string | null;
}

export interface IngestionJobRepository {
  /** ジョブ開始時に呼び出す（設計書⑨「失敗時リトライ・ingestion_jobsに監査記録」）。 */
  create(input: CreateIngestionJobInput): Promise<IngestionJob>;
  /** ジョブ完了/失敗時にstatus・diffSummary・errorMessageを更新する。 */
  update(id: string, input: UpdateIngestionJobInput): Promise<IngestionJob>;
}
