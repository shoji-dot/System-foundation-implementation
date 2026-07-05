import type { Course } from "./course.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaCourseRepository）。
 */
export const COURSE_REPOSITORY = Symbol("COURSE_REPOSITORY");

export interface CourseListFilters {
  /** カーソルページネーション（設計書⑤）: 前回応答の nextCursor をそのまま渡す。 */
  cursor?: string;
  limit: number;
}

export interface CourseListResult {
  items: Course[];
  /** 次ページが無い場合は null（設計書⑤ カーソルページネーション）。 */
  nextCursor: string | null;
}

export interface CourseRepository {
  findMany(filters: CourseListFilters): Promise<CourseListResult>;
}
