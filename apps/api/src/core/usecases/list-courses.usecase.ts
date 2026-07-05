import { Inject, Injectable } from "@nestjs/common";

import type { CourseListResult, CourseRepository } from "../domain/course.repository";
import { COURSE_REPOSITORY } from "../domain/course.repository";

export interface ListCoursesInput {
  cursor?: string;
  limit: number;
}

/**
 * 学習コース一覧取得ユースケース（設計書⑤ GET /api/v1/courses、S10）。
 */
@Injectable()
export class ListCoursesUsecase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: CourseRepository,
  ) {}

  async execute(input: ListCoursesInput): Promise<CourseListResult> {
    return this.courseRepository.findMany({
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
