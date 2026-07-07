import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type { CourseDetailResponse, CourseListResponse } from "@yakuji/shared";
import { courseDetailResponseSchema, courseListResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetCourseDetailUsecase } from "../../core/usecases/get-course-detail.usecase";
import { ListCoursesUsecase } from "../../core/usecases/list-courses.usecase";

import { CourseIdParamDto } from "./dto/course-id-param.dto";
import { ListCoursesQueryDto } from "./dto/list-courses-query.dto";

/**
 * 設計書⑤ GET /api/v1/courses（S10 学習コース一覧）。
 * 設計書⑬画面遷移: S10はS04(ホーム)ログイン後のみ到達するため、JwtAuthGuardで保護する。
 * GET /courses/:id は設計書⑤に明記は無いがS10「コース詳細（レッスン一覧）」表示に必要なため
 * ユーザー承認済みで追加（classifications:idと同方針）。
 */
@Controller("courses")
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private readonly listCoursesUsecase: ListCoursesUsecase,
    private readonly getCourseDetailUsecase: GetCourseDetailUsecase,
  ) {}

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

  @Get(":id")
  async detail(@Param() params: CourseIdParamDto): Promise<CourseDetailResponse> {
    const course = await this.getCourseDetailUsecase.execute(params.id);

    return courseDetailResponseSchema.parse({
      id: course.id,
      title: course.title,
      description: course.description,
      order: course.order,
    });
  }
}
