import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";
import type { Tag } from "../domain/tag.entity";
import type { TaggingRepository } from "../domain/tagging.repository";
import { TAGGING_REPOSITORY } from "../domain/tagging.repository";

export interface ListLessonTagsInput {
  lessonId: string;
}

/**
 * レッスンに付与されたタグ一覧取得ユースケース（設計書④ taggings、⑫ S21「タグ管理」）。
 */
@Injectable()
export class ListLessonTagsUsecase {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepository: LessonRepository,
    @Inject(TAGGING_REPOSITORY) private readonly taggingRepository: TaggingRepository,
  ) {}

  async execute(input: ListLessonTagsInput): Promise<Tag[]> {
    const lesson = await this.lessonRepository.findDetailById(input.lessonId);
    if (!lesson) {
      throw new NotFoundException("指定されたレッスンが見つかりません。");
    }

    return this.taggingRepository.listTagsForTaggable("LESSON", input.lessonId);
  }
}
