import type { AuditLog } from "./audit-log.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaAuditLogRepository）。
 */
export const AUDIT_LOG_REPOSITORY = Symbol("AUDIT_LOG_REPOSITORY");

/**
 * 監査ログ記録の入力（設計書④ audit_logs: actor, action, target, at 準拠）。
 * target は「対象種別:対象ID」の自由記述とする（設計書④は target を単一列として定義しており、
 * 種別+ID分割列への変更は行わない）。
 */
export interface CreateAuditLogInput {
  actorId: string | null;
  action: string;
  target: string;
}

/** 監査ログ一覧のカーソルページネーション入力（設計書⑫、他一覧APIと同様の方式）。 */
export interface ListAuditLogsFilters {
  cursor?: string;
  limit: number;
}

export interface AuditLogListResult {
  items: AuditLog[];
  nextCursor: string | null;
}

export interface AuditLogRepository {
  /** 監査ログは追記のみ（更新・削除しない）。 */
  create(input: CreateAuditLogInput): Promise<AuditLog>;
  /** 新しい記録から順に返す（管理画面での閲覧用途のため）。 */
  list(filters: ListAuditLogsFilters): Promise<AuditLogListResult>;
}
