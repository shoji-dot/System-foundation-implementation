/**
 * 監査ログ（設計書④ audit_logs 準拠、Phase6 商用化）: actor, action, target, at の4項目を保持する。
 * 追記のみで更新・削除は行わない不変のイベント記録のため updatedAt は持たない
 * （regulation_relations / classification_mappings 等と同様の方針）。
 */
export interface AuditLog {
  id: string;
  /** システム起因の操作（取込パイプライン⑨等）ではnull（操作主体がユーザーでないため）。 */
  actorId: string | null;
  action: string;
  /** 「対象種別:対象ID」形式の自由記述（例: "regulation:0198f2c3-..."）。 */
  target: string;
  createdAt: Date;
}
