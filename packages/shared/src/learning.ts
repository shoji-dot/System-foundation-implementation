/**
 * 学習進捗ステータス（設計書 ④ user_progress 準拠）。
 */
export const PROGRESS_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];
