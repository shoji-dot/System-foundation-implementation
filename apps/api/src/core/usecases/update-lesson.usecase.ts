import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";

export interface UpdateLessonInput {
  id: string;
  title?: string;
  body?: string;
  order?: number;
}

/**
 * レッスン更新ユースケース（部分更新、設計書④ lessons、⑫ S21「レッスン管理」）。
 * courseIdの変更は対象外（コース間移動は今回のスコープ外）。
 */
@Injectable()
export class UpdateLessonUsecase {
  constructor(@Inject(LESSON_REPOSITORY) private readonly lessonRepository: LessonRepository) {}

  async execute(input: UpdateLessonInput): Promise<Lesson> {
    const existing = await this.lessonRepository.findDetailById(input.id);
    if (!existing) {
      throw new NotFoundException("指定されたレッスンが見つかりません。");
    }

    if (input.order !== undefined && input.order !== existing.order) {
      const duplicate = await this.lessonRepository.findByCourseIdAndOrder(
        existing.courseId,
        input.order,
      );
      if (duplicate && duplicate.id !== input.id) {
        throw new ConflictException("同じ表示順のレッスンが既にこのコースに存在します。");
      }
    }

    return this.lessonRepository.update(input.id, {
      title: input.title?.trim(),
      body: input.body,
      order: input.order,
    });
  }
}
