import type { Lesson, LessonSummary } from "./lesson.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaLessonRepository）。
 */
export const LESSON_REPOSITORY = Symbol("LESSON_REPOSITORY");

export interface LessonListFilters {
  /** コースIDで絞り込む（設計書⑤ GET /api/v1/lessons、S11）。 */
  courseId?: string;
  /** カーソルページネーション（設計書⑤）: 前回応答の nextCursor をそのまま渡す。 */
  cursor?: string;
  limit: number;
}

export interface LessonListResult {
  items: LessonSummary[];
  /** 次ページが無い場合は null（設計書⑤ カーソルページネーション）。 */
  nextCursor: string | null;
}

export interface LessonRepository {
  findMany(filters: LessonListFilters): Promise<LessonListResult>;
  /** 設計書⑤ GET /api/v1/lessons/:id（本文込み、S11詳細）。存在しない場合は null。 */
  findDetailById(id: string): Promise<Lesson | null>;
}
