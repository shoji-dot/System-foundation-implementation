import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";
import type { TagRepository } from "../domain/tag.repository";
import { TAG_REPOSITORY } from "../domain/tag.repository";
import type { TaggingRepository } from "../domain/tagging.repository";
import { TAGGING_REPOSITORY } from "../domain/tagging.repository";

export interface AttachTagToLessonInput {
  lessonId: string;
  tagId: string;
}

/**
 * レッスンへのタグ付与ユースケース（設計書④ taggings、⑫ S21「タグ管理」）。
 */
@Injectable()
export class AttachTagToLessonUsecase {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepository: LessonRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
    @Inject(TAGGING_REPOSITORY) private readonly taggingRepository: TaggingRepository,
  ) {}

  async execute(input: AttachTagToLessonInput): Promise<void> {
    const lesson = await this.lessonRepository.findDetailById(input.lessonId);
    if (!lesson) {
      throw new NotFoundException("指定されたレッスンが見つかりません。");
    }

    const tag = await this.tagRepository.findById(input.tagId);
    if (!tag) {
      throw new NotFoundException("指定されたタグが見つかりません。");
    }

    const alreadyTagged = await this.taggingRepository.exists(
      input.tagId,
      "LESSON",
      input.lessonId,
    );
    if (alreadyTagged) {
      throw new ConflictException("このレッスンには既に同じタグが付与されています。");
    }

    await this.taggingRepository.create({
      tagId: input.tagId,
      taggableType: "LESSON",
      taggableId: input.lessonId,
    });
  }
}
