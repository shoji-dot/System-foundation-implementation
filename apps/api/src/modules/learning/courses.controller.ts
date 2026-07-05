import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { CourseListResponse } from "@yakuji/shared";
import { courseListResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListCoursesUsecase } from "../../core/usecases/list-courses.usecase";

import { ListCoursesQueryDto } from "./dto/list-courses-query.dto";

/**
 * 設計書⑤ GET /api/v1/courses（S10 学習コース一覧）。
 * 設計書⑬画面遷移: S10はS04(ホーム)ログイン後のみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("courses")
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly listCoursesUsecase: ListCoursesUsecase) {}

  @Get()
  async list(@Query() query: ListCoursesQueryDto): Promise<CourseListResponse> {
    const result = await this.listCoursesUsecase.execute({
      cursor: query.cursor,
      limit: query.limit,
    });

    return courseListResponseSchema.parse({
      items: result.items.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        order: course.order,
      })),
      nextCursor: result.nextCursor,
    });
  }
}
