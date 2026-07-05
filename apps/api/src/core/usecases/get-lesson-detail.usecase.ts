import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";

/**
 * レッスン詳細取得ユースケース（設計書⑤ GET /api/v1/lessons/:id、本文込み、S11）。
 */
@Injectable()
export class GetLessonDetailUsecase {
  constructor(
    @Inject(LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(id: string): Promise<Lesson> {
    const detail = await this.lessonRepository.findDetailById(id);
    if (!detail) {
      throw new NotFoundException("指定されたレッスンが見つかりません。");
    }
    return detail;
  }
}
