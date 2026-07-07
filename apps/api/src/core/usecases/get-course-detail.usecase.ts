import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";
import { COURSE_REPOSITORY } from "../domain/course.repository";

/**
 * 学習コース詳細取得ユースケース（設計書⑤に明記は無いがS10「コース詳細（レッスン一覧）」表示に
 * 必要なためユーザー承認済みで追加、GET /api/v1/courses/:id、get-classification-detail.usecase.tsと同方針）。
 */
@Injectable()
export class GetCourseDetailUsecase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: CourseRepository,
  ) {}

  async execute(id: string): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundException("指定された学習コースが見つかりません。");
    }
    return course;
  }
}
