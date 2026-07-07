import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";
import type { TaggingRepository } from "../domain/tagging.repository";
import { TAGGING_REPOSITORY } from "../domain/tagging.repository";

/**
 * レッスン削除ユースケース（設計書④ lessons、⑫ S21「レッスン管理」）。物理削除
 * （設計書④「論理削除は法規制系のみ」の方針）。
 * quizzes/quiz_questions/user_progressはDBのonDelete Cascadeで自動削除されるが、
 * taggings.taggable_id はpolymorphic設計上FK制約が無くカスケードされないため、
 * レッスン本体を削除する前にタグ付けを明示的に削除し孤立を防ぐ（DeleteCourseUsecaseのコメントと同方針）。
 */
@Injectable()
export class DeleteLessonUsecase {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepository: LessonRepository,
    @Inject(TAGGING_REPOSITORY) private readonly taggingRepository: TaggingRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.lessonRepository.findDetailById(id);
    if (!existing) {
      throw new NotFoundException("指定されたレッスンが見つかりません。");
    }

    await this.taggingRepository.deleteAllForTaggable("LESSON", id);
    await this.lessonRepository.delete(id);
  }
}
