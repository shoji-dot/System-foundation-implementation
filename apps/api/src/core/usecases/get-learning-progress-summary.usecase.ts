import { Inject, Injectable } from "@nestjs/common";

import type { ProgressSummary } from "../domain/progress.entity";
import type { ProgressRepository } from "../domain/progress.repository";
import { PROGRESS_REPOSITORY } from "../domain/progress.repository";

/**
 * 学習進捗サマリ取得ユースケース（GET /api/v1/progress/summary、S04「学習進捗」・S13）。
 * ログイン中のユーザー自身の全レッスンに対する完了・進行中の件数を返す。
 */
@Injectable()
export class GetLearningProgressSummaryUsecase {
  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly progressRepository: ProgressRepository,
  ) {}

  async execute(userId: string): Promise<ProgressSummary> {
    return this.progressRepository.getSummaryForUser(userId);
  }
}
