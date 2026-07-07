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

/**
 * 学習進捗サマリ（S04「学習進捗」・S13向け集計）。ログイン中のユーザー自身の全レッスンに対する
 * 完了・進行中の件数を返す（コース別内訳は今回のスコープ外）。
 */
export interface ProgressSummary {
  totalLessons: number;
  completedCount: number;
  inProgressCount: number;
}

/**
 * レッスン単位の進捗一覧項目（設計書⑤に明記は無いがS13「修了状況・スコア」表示に必要なため
 * ユーザー承認済みで追加、GET /api/v1/progress）。表示用にレッスン名・コース名を含める。
 */
export interface ProgressListItem extends Progress {
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
}

export interface ProgressListResult {
  items: ProgressListItem[];
  /** 次ページが無い場合は null（設計書⑤ カーソルページネーション準拠）。 */
  nextCursor: string | null;
}
