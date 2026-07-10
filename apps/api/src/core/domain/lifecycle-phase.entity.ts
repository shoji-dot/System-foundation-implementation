/**
 * 大工程コード（設計変更書_ライフサイクル管理_SaaS化.md ② DB変更 LifecyclePhase 準拠、Phase7 7-2）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * Prisma schemaのLifecyclePhaseCode enumと値を一致させる（企画〜販売終了までの18工程）。
 */
export type LifecyclePhaseCode =
  | "PLANNING"
  | "MARKET_RESEARCH"
  | "DESIGN"
  | "RISK_ISO14971"
  | "QMS"
  | "TESTING"
  | "REG_STRATEGY"
  | "SUBMISSION"
  | "PMDA_CONSULT"
  | "APPROVAL"
  | "REIMBURSEMENT"
  | "LAUNCH"
  | "SALES"
  | "CHANGE_CONTROL"
  | "COMPLAINT"
  | "CAPA"
  | "RECALL"
  | "DISCONTINUATION";

export interface LifecyclePhase {
  id: string;
  code: LifecyclePhaseCode;
  name: string;
  order: number;
}
