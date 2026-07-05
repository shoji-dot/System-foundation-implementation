/**
 * 学習進捗ドメインエンティティ（設計書④ user_progress 準拠、S13）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface Progress {
  id: string;
  lessonId: string;
  status: ProgressStatus;
  score: number | null;
  completedAt: Date | null;
}
