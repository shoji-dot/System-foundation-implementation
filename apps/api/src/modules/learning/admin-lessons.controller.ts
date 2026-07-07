import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { LessonDetailResponse } from "@yakuji/shared";
import { lessonDetailResponseSchema } from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { Lesson } from "../../core/domain/lesson.entity";
import { CreateLessonUsecase } from "../../core/usecases/create-lesson.usecase";
import { DeleteLessonUsecase } from "../../core/usecases/delete-lesson.usecase";
import { UpdateLessonUsecase } from "../../core/usecases/update-lesson.usecase";

import { CreateLessonRequestDto } from "./dto/create-lesson-request.dto";
import { LessonIdParamDto } from "./dto/lesson-id-param.dto";
import { UpdateLessonRequestDto } from "./dto/update-lesson-request.dto";

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちレッスン管理部分（設計書⑤のAPI一覧に明記は無いが、
 * S11の元となるレッスンデータを管理画面から編集する手段としてユーザー承認済みで追加）。
 * コース管理(AdminCoursesController)と同様 editor/admin 限定（設計書⑦ RBAC）。
 */
@Controller("admin/lessons")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class AdminLessonsController {
  constructor(
    private readonly createLessonUsecase: CreateLessonUsecase,
    private readonly updateLessonUsecase: UpdateLessonUsecase,
    private readonly deleteLessonUsecase: DeleteLessonUsecase,
  ) {}

  @Post()
  async create(@Body() body: CreateLessonRequestDto): Promise<LessonDetailResponse> {
    const lesson = await this.createLessonUsecase.execute({
      courseId: body.courseId,
      title: body.title,
      body: body.body,
      order: body.order,
    });

    return lessonDetailResponseSchema.parse(toResponse(lesson));
  }

  @Patch(":id")
  async update(
    @Param() params: LessonIdParamDto,
    @Body() body: UpdateLessonRequestDto,
  ): Promise<LessonDetailResponse> {
    const lesson = await this.updateLessonUsecase.execute({
      id: params.id,
      title: body.title,
      body: body.body,
      order: body.order,
    });

    return lessonDetailResponseSchema.parse(toResponse(lesson));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: LessonIdParamDto): Promise<void> {
    await this.deleteLessonUsecase.execute(params.id);
  }
}

function toResponse(lesson: Lesson) {
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    order: lesson.order,
    body: lesson.body,
  };
}
