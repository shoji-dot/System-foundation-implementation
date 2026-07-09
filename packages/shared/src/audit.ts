import { z } from "zod";

/**
 * 監査ログ一覧クエリ（設計書④ audit_logs、Phase6 商用化、カーソルページネーション準拠）。
 * 設計書⑤のAPI一覧には本エンドポイントの明記が無いが、記録済み監査ログを閲覧する手段として
 * ユーザー承認のうえ追加する（S21「管理: コンテンツ管理」＝コース/タグ/ユーザー管理とは別画面）。
 */
export const listAuditLogsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

/**
 * 監査ログ項目応答（設計書④ audit_logs: actor, action, target, at の4項目のみ）。
 */
export const auditLogResponseSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  action: z.string(),
  target: z.string(),
  createdAt: z.string().datetime(),
});
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

/**
 * カーソルページネーション応答（監査ログ一覧、GET /api/v1/admin/audit-logs）。
 */
export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogResponseSchema),
  nextCursor: z.string().nullable(),
});
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>;
