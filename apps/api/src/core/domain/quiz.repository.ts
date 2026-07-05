import type { Quiz } from "./quiz.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaQuizRepository）。
 */
export const QUIZ_REPOSITORY = Symbol("QUIZ_REPOSITORY");

export interface QuizListFilters {
  /** レッスンIDで絞り込む（設計書⑤ GET /api/v1/quizzes、S12）。 */
  lessonId?: string;
}

export interface QuizRepository {
  /**
   * レッスンあたりのクイズ件数は少ないため、classification_mappings一覧と同様ページネーションは行わない。
   */
  findMany(filters: QuizListFilters): Promise<Quiz[]>;
}
