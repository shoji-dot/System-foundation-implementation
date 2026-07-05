/**
 * 取込ジョブ実行履歴ドメインエンティティ（設計書④ ingestion_jobs 準拠、⑨の実行履歴）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type IngestionJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface IngestionJob {
  id: string;
  /** Adapter識別子（例: "PMDA_DEVICE_SAFETY_NOTICES"）。 */
  source: string;
  status: IngestionJobStatus;
  /** 差分要約（非AI、簡易生成）。ジョブ失敗時や差分なしの場合はnull。 */
  diffSummary: string | null;
  /** 失敗時の原因（設計書⑨「失敗時リトライ・ingestion_jobsに監査記録」）。 */
  errorMessage: string | null;
  runAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
