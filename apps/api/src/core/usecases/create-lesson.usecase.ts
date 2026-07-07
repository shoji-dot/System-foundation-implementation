import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { CourseRepository } from "../domain/course.repository";
import { COURSE_REPOSITORY } from "../domain/course.repository";
import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";

export interface CreateLessonInput {
  courseId: string;
  title: string;
  body: string;
  order: number;
}

/**
 * レッスン作成ユースケース（設計書④ lessons、⑫ S21「レッスン管理」）。
 */
@Injectable()
export class CreateLessonUsecase {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepository: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(input: CreateLessonInput): Promise<Lesson> {
    const course = await this.courseRepository.findById(input.courseId);
    if (!course) {
      throw new NotFoundException("指定されたコースが見つかりません。");
    }

    const duplicate = await this.lessonRepository.findByCourseIdAndOrder(
      input.courseId,
      input.order,
    );
    if (duplicate) {
      throw new ConflictException("同じ表示順のレッスンが既にこのコースに存在します。");
    }

    return this.lessonRepository.create({
      courseId: input.courseId,
      title: input.title.trim(),
      body: input.body,
      order: input.order,
    });
  }
}
