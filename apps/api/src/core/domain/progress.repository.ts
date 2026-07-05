import type { Progress, ProgressStatus } from "./progress.entity";

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

export interface ProgressRepository {
  /**
   * 設計書④ user_progress の一意制約(userId, lessonId)に基づき、既存レコードがあれば更新、無ければ作成する
   * （設計書⑤ POST /api/v1/progress、同一レッスンへの再送信は上書きとして扱う）。
   */
  upsert(input: UpsertProgressInput): Promise<Progress>;
}
