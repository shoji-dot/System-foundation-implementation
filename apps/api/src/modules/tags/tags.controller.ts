import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { TagListResponse, TagResponse } from "@yakuji/shared";
import { tagListResponseSchema, tagResponseSchema } from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { Tag } from "../../core/domain/tag.entity";
import { CreateTagUsecase } from "../../core/usecases/create-tag.usecase";
import { DeleteTagUsecase } from "../../core/usecases/delete-tag.usecase";
import { ListTagsUsecase } from "../../core/usecases/list-tags.usecase";
import { UpdateTagUsecase } from "../../core/usecases/update-tag.usecase";

import { CreateTagRequestDto } from "./dto/create-tag-request.dto";
import { ListTagsQueryDto } from "./dto/list-tags-query.dto";
import { TagIdParamDto } from "./dto/tag-id-param.dto";
import { UpdateTagRequestDto } from "./dto/update-tag-request.dto";

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちタグ管理部分。設計書⑤のAPI一覧に本エンドポイントの
 * 明記は無いが、共通タグ機能（設計書④ tags/taggings）を管理画面から編集する手段としてユーザー承認の
 * うえ追加する。S20/監査ログ閲覧と同様 editor/admin 限定（設計書⑦ RBAC）。
 */
@Controller("admin/tags")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class TagsController {
  constructor(
    private readonly listTagsUsecase: ListTagsUsecase,
    private readonly createTagUsecase: CreateTagUsecase,
    private readonly updateTagUsecase: UpdateTagUsecase,
    private readonly deleteTagUsecase: DeleteTagUsecase,
  ) {}

  @Get()
  async list(@Query() query: ListTagsQueryDto): Promise<TagListResponse> {
    const result = await this.listTagsUsecase.execute({
      cursor: query.cursor,
      limit: query.limit,
    });

    return tagListResponseSchema.parse({
      items: result.items.map((tag) => toResponse(tag)),
      nextCursor: result.nextCursor,
    });
  }

  @Post()
  async create(@Body() body: CreateTagRequestDto): Promise<TagResponse> {
    const tag = await this.createTagUsecase.execute({ name: body.name });

    return tagResponseSchema.parse(toResponse(tag));
  }

  @Patch(":id")
  async update(
    @Param() params: TagIdParamDto,
    @Body() body: UpdateTagRequestDto,
  ): Promise<TagResponse> {
    const tag = await this.updateTagUsecase.execute({ id: params.id, name: body.name });

    return tagResponseSchema.parse(toResponse(tag));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: TagIdParamDto): Promise<void> {
    await this.deleteTagUsecase.execute(params.id);
  }
}

function toResponse(tag: Tag) {
  return {
    id: tag.id,
    name: tag.name,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}
