import { Inject, Injectable } from "@nestjs/common";

import type { ProgressListResult } from "../domain/progress.entity";
import type { ProgressRepository } from "../domain/progress.repository";
import { PROGRESS_REPOSITORY } from "../domain/progress.repository";

export interface ListLearningProgressInput {
  userId: string;
  cursor?: string;
  limit: number;
}

/**
 * 学習進捗一覧取得ユースケース（GET /api/v1/progress、設計書⑤に明記は無いがS13
 * 「修了状況・スコア」表示に必要なためユーザー承認済みで追加）。
 * ログイン中のユーザー自身のレッスン別進捗のみを返す（アクセストークンから取得したuserIdに限定）。
 */
@Injectable()
export class ListLearningProgressUsecase {
  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly progressRepository: ProgressRepository,
  ) {}

  async execute(input: ListLearningProgressInput): Promise<ProgressListResult> {
    return this.progressRepository.findManyByUserId({
      userId: input.userId,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
