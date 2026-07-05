import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";
import type { Progress, ProgressStatus } from "../domain/progress.entity";
import type { ProgressRepository } from "../domain/progress.repository";
import { PROGRESS_REPOSITORY } from "../domain/progress.repository";

export interface RecordProgressInput {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  score?: number;
}

/**
 * 学習進捗記録ユースケース（設計書⑤ POST /api/v1/progress、S13）。
 * ログイン中のユーザー自身のレッスン進捗をupsertする。
 */
@Injectable()
export class RecordProgressUsecase {
  constructor(
    @Inject(PROGRESS_REPOSITORY)
    private readonly progressRepository: ProgressRepository,
    @Inject(LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(input: RecordProgressInput): Promise<Progress> {
    const lesson = await this.lessonRepository.findDetailById(input.lessonId);
    if (!lesson) {
      throw new NotFoundException("指定されたレッスンが見つかりません。");
    }

    return this.progressRepository.upsert({
      userId: input.userId,
      lessonId: input.lessonId,
      status: input.status,
      score: input.score,
    });
  }
}
