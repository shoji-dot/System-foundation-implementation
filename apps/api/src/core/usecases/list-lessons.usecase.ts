import { Inject, Injectable } from "@nestjs/common";

import type { LessonListResult, LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";

export interface ListLessonsInput {
  courseId?: string;
  cursor?: string;
  limit: number;
}

/**
 * レッスン一覧取得ユースケース（設計書⑤ GET /api/v1/lessons?courseId=、S11）。
 */
@Injectable()
export class ListLessonsUsecase {
  constructor(
    @Inject(LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(input: ListLessonsInput): Promise<LessonListResult> {
    return this.lessonRepository.findMany({
      courseId: input.courseId,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
