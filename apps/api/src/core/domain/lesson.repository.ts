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

export interface CreateLessonInput {
  courseId: string;
  title: string;
  body: string;
  order: number;
}

export interface UpdateLessonInput {
  title?: string;
  body?: string;
  order?: number;
}

export interface LessonRepository {
  findMany(filters: LessonListFilters): Promise<LessonListResult>;
  /** 設計書⑤ GET /api/v1/lessons/:id（本文込み、S11詳細）。存在しない場合は null。 */
  findDetailById(id: string): Promise<Lesson | null>;
  /** @@unique([courseId, order]) の事前チェック用（S21「レッスン管理」の重複order検知）。 */
  findByCourseIdAndOrder(courseId: string, order: number): Promise<Lesson | null>;
  /** S21「管理: コンテンツ管理」レッスン管理向け書き込みAPI。 */
  create(input: CreateLessonInput): Promise<Lesson>;
  update(id: string, input: UpdateLessonInput): Promise<Lesson>;
  delete(id: string): Promise<void>;
}
