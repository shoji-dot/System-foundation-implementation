import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type { LessonDetailResponse, LessonListResponse } from "@yakuji/shared";
import { lessonDetailResponseSchema, lessonListResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetLessonDetailUsecase } from "../../core/usecases/get-lesson-detail.usecase";
import { ListLessonsUsecase } from "../../core/usecases/list-lessons.usecase";

import { LessonIdParamDto } from "./dto/lesson-id-param.dto";
import { ListLessonsQueryDto } from "./dto/list-lessons-query.dto";

/**
 * 設計書⑤ GET /api/v1/lessons?courseId=、/lessons/:id（S11 レッスン一覧・詳細）。
 * 設計書⑬画面遷移: S11はS10経由でのみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("lessons")
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(
    private readonly listLessonsUsecase: ListLessonsUsecase,
    private readonly getLessonDetailUsecase: GetLessonDetailUsecase,
  ) {}

  @Get()
  async list(@Query() query: ListLessonsQueryDto): Promise<LessonListResponse> {
    const result = await this.listLessonsUsecase.execute({
      courseId: query.courseId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return lessonListResponseSchema.parse({
      items: result.items.map((lesson) => ({
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        order: lesson.order,
      })),
      nextCursor: result.nextCursor,
    });
  }

  @Get(":id")
  async detail(@Param() params: LessonIdParamDto): Promise<LessonDetailResponse> {
    const lesson = await this.getLessonDetailUsecase.execute(params.id);

    return lessonDetailResponseSchema.parse({
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      order: lesson.order,
      body: lesson.body,
    });
  }
}
