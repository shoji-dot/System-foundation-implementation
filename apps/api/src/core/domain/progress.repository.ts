import type {
  Progress,
  ProgressListResult,
  ProgressStatus,
  ProgressSummary,
} from "./progress.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaProgressRepository）。
 */
export const PROGRESS_REPOSITORY = Symbol("PROGRESS_REPOSITORY");

export interface UpsertProgressInput {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  score?: number;
}

export interface ProgressListFilters {
  userId: string;
  cursor?: string;
  limit: number;
}

export interface ProgressRepository {
  /**
   * 設計書④ user_progress の一意制約(userId, lessonId)に基づき、既存レコードがあれば更新、無ければ作成する
   * （設計書⑤ POST /api/v1/progress、同一レッスンへの再送信は上書きとして扱う）。
   */
  upsert(input: UpsertProgressInput): Promise<Progress>;
  /** GET /api/v1/progress/summary（S04「学習進捗」・S13）: ログイン中のユーザー自身の集計を返す。 */
  getSummaryForUser(userId: string): Promise<ProgressSummary>;
  /**
   * GET /api/v1/progress（設計書⑤に明記は無いがS13「修了状況・スコア」一覧表示に必要なため
   * ユーザー承認済みで追加）: ログイン中のユーザー自身のレッスン別進捗をカーソルページネーションで返す。
   */
  findManyByUserId(filters: ProgressListFilters): Promise<ProgressListResult>;
}
