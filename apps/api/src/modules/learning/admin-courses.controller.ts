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
import type { CourseDetailResponse } from "@yakuji/shared";
import { courseDetailResponseSchema } from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { Course } from "../../core/domain/course.entity";
import { CreateCourseUsecase } from "../../core/usecases/create-course.usecase";
import { DeleteCourseUsecase } from "../../core/usecases/delete-course.usecase";
import { UpdateCourseUsecase } from "../../core/usecases/update-course.usecase";

import { CourseIdParamDto } from "./dto/course-id-param.dto";
import { CreateCourseRequestDto } from "./dto/create-course-request.dto";
import { UpdateCourseRequestDto } from "./dto/update-course-request.dto";

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちコース管理部分（設計書⑤のAPI一覧に明記は無いが、
 * S10の元となるコースデータを管理画面から編集する手段としてユーザー承認済みで追加）。
 * S20/タグ管理と同様 editor/admin 限定（設計書⑦ RBAC）。
 */
@Controller("admin/courses")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class AdminCoursesController {
  constructor(
    private readonly createCourseUsecase: CreateCourseUsecase,
    private readonly updateCourseUsecase: UpdateCourseUsecase,
    private readonly deleteCourseUsecase: DeleteCourseUsecase,
  ) {}

  @Post()
  async create(@Body() body: CreateCourseRequestDto): Promise<CourseDetailResponse> {
    const course = await this.createCourseUsecase.execute({
      title: body.title,
      description: body.description,
      order: body.order,
    });

    return courseDetailResponseSchema.parse(toResponse(course));
  }

  @Patch(":id")
  async update(
    @Param() params: CourseIdParamDto,
    @Body() body: UpdateCourseRequestDto,
  ): Promise<CourseDetailResponse> {
    const course = await this.updateCourseUsecase.execute({
      id: params.id,
      title: body.title,
      description: body.description,
      order: body.order,
    });

    return courseDetailResponseSchema.parse(toResponse(course));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: CourseIdParamDto): Promise<void> {
    await this.deleteCourseUsecase.execute(params.id);
  }
}

function toResponse(course: Course) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    order: course.order,
  };
}
