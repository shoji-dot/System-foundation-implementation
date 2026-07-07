import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type {
  ClassificationListResponse,
  ClassificationMappingListResponse,
  ClassificationResponse,
} from "@yakuji/shared";
import {
  classificationListResponseSchema,
  classificationMappingListResponseSchema,
  classificationResponseSchema,
} from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetClassificationDetailUsecase } from "../../core/usecases/get-classification-detail.usecase";
import { GetClassificationMappingsUsecase } from "../../core/usecases/get-classification-mappings.usecase";
import { ListClassificationsUsecase } from "../../core/usecases/list-classifications.usecase";

import { ClassificationIdParamDto } from "./dto/classification-id-param.dto";
import { ListClassificationsQueryDto } from "./dto/list-classifications-query.dto";

/**
 * 設計書⑤ GET /api/v1/classifications、/classifications/:id/mappings（S08/S09 JMDN検索）。
 * 設計書⑬画面遷移: S08/S09はS04(ホーム)ログイン後のみ到達するため、JwtAuthGuardで保護する。
 * GET /classifications/:id は設計書⑤に明記は無いがS09「分類詳細」表示に必要なためユーザー承認済みで追加。
 */
@Controller("classifications")
@UseGuards(JwtAuthGuard)
export class ClassificationsController {
  constructor(
    private readonly listClassificationsUsecase: ListClassificationsUsecase,
    private readonly getClassificationDetailUsecase: GetClassificationDetailUsecase,
    private readonly getClassificationMappingsUsecase: GetClassificationMappingsUsecase,
  ) {}

  @Get()
  async list(@Query() query: ListClassificationsQueryDto): Promise<ClassificationListResponse> {
    const result = await this.listClassificationsUsecase.execute({
      scheme: query.scheme,
      jurisdiction: query.jurisdiction,
      q: query.q,
      cursor: query.cursor,
      limit: query.limit,
    });

    return classificationListResponseSchema.parse({
      items: result.items.map((classification) => ({
        id: classification.id,
        jurisdiction: classification.jurisdiction,
        scheme: classification.scheme,
        code: classification.code,
        name: classification.name,
        class: classification.class,
        definition: classification.definition,
      })),
      nextCursor: result.nextCursor,
    });
  }

  @Get(":id")
  async detail(@Param() params: ClassificationIdParamDto): Promise<ClassificationResponse> {
    const classification = await this.getClassificationDetailUsecase.execute(params.id);

    return classificationResponseSchema.parse({
      id: classification.id,
      jurisdiction: classification.jurisdiction,
      scheme: classification.scheme,
      code: classification.code,
      name: classification.name,
      class: classification.class,
      definition: classification.definition,
    });
  }

  @Get(":id/mappings")
  async mappings(
    @Param() params: ClassificationIdParamDto,
  ): Promise<ClassificationMappingListResponse> {
    const result = await this.getClassificationMappingsUsecase.execute(params.id);

    return classificationMappingListResponseSchema.parse({
      items: result.map((mapping) => ({
        id: mapping.id,
        confidence: mapping.confidence,
        classification: {
          id: mapping.classification.id,
          jurisdiction: mapping.classification.jurisdiction,
          scheme: mapping.classification.scheme,
          code: mapping.classification.code,
          name: mapping.classification.name,
          class: mapping.classification.class,
          definition: mapping.classification.definition,
        },
      })),
    });
  }
}
