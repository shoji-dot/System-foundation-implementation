/**
 * 学習進捗ステータス（設計書 ④ user_progress 準拠）。
 */
export const PROGRESS_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

/**
 * 学習進捗ステータスの日本語表示名。フロントエンドの複数箇所（S13進捗一覧）で共通利用するため、
 * DRY原則に基づきここに集約する（TASK_STATUS_LABELS等と同じ方針）。
 */
export const PROGRESS_STATUS_LABELS: Record<ProgressStatus, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "進行中",
  COMPLETED: "完了",
};
