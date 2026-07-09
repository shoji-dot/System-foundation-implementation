import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { LessonTagListResponse } from "@yakuji/shared";
import { lessonTagListResponseSchema } from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AttachTagToLessonUsecase } from "../../core/usecases/attach-tag-to-lesson.usecase";
import { DetachTagFromLessonUsecase } from "../../core/usecases/detach-tag-from-lesson.usecase";
import { ListLessonTagsUsecase } from "../../core/usecases/list-lesson-tags.usecase";

import { AttachTagToLessonRequestDto } from "./dto/attach-tag-to-lesson-request.dto";
import { LessonTagParamDto } from "./dto/lesson-tag-param.dto";
import { LessonTagsParamDto } from "./dto/lesson-tags-param.dto";

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちタグ管理部分、レッスンへのタグ付与/解除
 * （設計書④ taggings、⑤のAPI一覧に明記は無いがタグ管理画面から編集する手段としてユーザー承認済みで追加）。
 * S20/タグマスタ管理と同様 editor/admin 限定（設計書⑦ RBAC）。
 */
@Controller("admin/lessons/:lessonId/tags")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class LessonTagsController {
  constructor(
    private readonly listLessonTagsUsecase: ListLessonTagsUsecase,
    private readonly attachTagToLessonUsecase: AttachTagToLessonUsecase,
    private readonly detachTagFromLessonUsecase: DetachTagFromLessonUsecase,
  ) {}

  @Get()
  async list(@Param() params: LessonTagsParamDto): Promise<LessonTagListResponse> {
    const tags = await this.listLessonTagsUsecase.execute({ lessonId: params.lessonId });

    return lessonTagListResponseSchema.parse({
      items: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
      })),
    });
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async attach(
    @Param() params: LessonTagsParamDto,
    @Body() body: AttachTagToLessonRequestDto,
  ): Promise<void> {
    await this.attachTagToLessonUsecase.execute({ lessonId: params.lessonId, tagId: body.tagId });
  }

  @Delete(":tagId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async detach(@Param() params: LessonTagParamDto): Promise<void> {
    await this.detachTagFromLessonUsecase.execute({
      lessonId: params.lessonId,
      tagId: params.tagId,
    });
  }
}
