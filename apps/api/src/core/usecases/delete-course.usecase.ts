import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { CourseRepository } from "../domain/course.repository";
import { COURSE_REPOSITORY } from "../domain/course.repository";
import type { LessonRepository } from "../domain/lesson.repository";
import { LESSON_REPOSITORY } from "../domain/lesson.repository";

/**
 * コース削除ユースケース（設計書④ courses、⑫ S21「コース管理」）。物理削除
 * （設計書④「論理削除は法規制系のみ」の方針）。
 * DBスキーマ上 lessons.course_id は onDelete: Cascade だが、taggings.taggable_id は polymorphic設計上
 * FK制約を持たないため、コース削除に伴うレッスンのカスケード削除は当該レッスンのタグ付け(taggings)を
 * 孤立させてしまう。そのため、レッスンが1件でも存在するコースの削除は拒否し、
 * 先にレッスンを個別削除（Task4 レッスン管理APIでtaggings削除込みの処理を行う）してもらう方針とする。
 */
@Injectable()
export class DeleteCourseUsecase {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepository: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("指定されたコースが見つかりません。");
    }

    const lessons = await this.lessonRepository.findMany({ courseId: id, limit: 1 });
    if (lessons.items.length > 0) {
      throw new ConflictException(
        "レッスンが存在するコースは削除できません。先にレッスンを削除してください。",
      );
    }

    await this.courseRepository.delete(id);
  }
}
