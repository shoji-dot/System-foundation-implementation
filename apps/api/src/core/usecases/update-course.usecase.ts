import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";
import { COURSE_REPOSITORY } from "../domain/course.repository";

export interface UpdateCourseInput {
  id: string;
  title?: string;
  description?: string | null;
  order?: number;
}

/**
 * コース更新ユースケース（部分更新、設計書④ courses、⑫ S21「コース管理」）。
 */
@Injectable()
export class UpdateCourseUsecase {
  constructor(@Inject(COURSE_REPOSITORY) private readonly courseRepository: CourseRepository) {}

  async execute(input: UpdateCourseInput): Promise<Course> {
    const existing = await this.courseRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException("指定されたコースが見つかりません。");
    }

    return this.courseRepository.update(input.id, {
      title: input.title?.trim(),
      description: input.description,
      order: input.order,
    });
  }
}
