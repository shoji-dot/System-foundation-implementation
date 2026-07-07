import { Inject, Injectable } from "@nestjs/common";

import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";
import { COURSE_REPOSITORY } from "../domain/course.repository";

export interface CreateCourseInput {
  title: string;
  description?: string | null;
  order: number;
}

/**
 * コース作成ユースケース（設計書④ courses、⑫ S21「管理: コンテンツ管理」コース管理）。
 */
@Injectable()
export class CreateCourseUsecase {
  constructor(@Inject(COURSE_REPOSITORY) private readonly courseRepository: CourseRepository) {}

  async execute(input: CreateCourseInput): Promise<Course> {
    return this.courseRepository.create({
      title: input.title.trim(),
      description: input.description ?? null,
      order: input.order,
    });
  }
}
