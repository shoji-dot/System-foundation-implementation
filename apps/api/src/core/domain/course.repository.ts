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

export interface CreateCourseInput {
  title: string;
  description?: string | null;
  order: number;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string | null;
  order?: number;
}

export interface CourseRepository {
  findMany(filters: CourseListFilters): Promise<CourseListResult>;
  /** GET /api/v1/courses/:id（S10 コース詳細、レッスン一覧画面表示向けにユーザー承認済みで追加）。 */
  findById(id: string): Promise<Course | null>;
  /** S21「管理: コンテンツ管理」コース管理向け書き込みAPI。 */
  create(input: CreateCourseInput): Promise<Course>;
  update(id: string, input: UpdateCourseInput): Promise<Course>;
  delete(id: string): Promise<void>;
}
