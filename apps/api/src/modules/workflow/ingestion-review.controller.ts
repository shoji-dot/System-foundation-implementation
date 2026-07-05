import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type {
  PendingReviewVersionDetailResponse,
  PendingReviewVersionListResponse,
} from "@yakuji/shared";
import {
  pendingReviewVersionDetailResponseSchema,
  pendingReviewVersionListResponseSchema,
} from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import type { PendingReviewVersionSummary } from "../../core/domain/regulation-ingestion.repository";
import { GetPendingReviewVersionDetailUsecase } from "../../core/usecases/get-pending-review-version-detail.usecase";
import { ListPendingReviewVersionsUsecase } from "../../core/usecases/list-pending-review-versions.usecase";

import { ListPendingReviewVersionsQueryDto } from "./dto/list-pending-review-versions-query.dto";
import { PendingReviewVersionIdParamDto } from "./dto/pending-review-version-id-param.dto";

/**
 * 設計書⑫ S20（管理: 取込レビュー）GET /api/v1/admin/ingestion/versions、/admin/ingestion/versions/:id。
 * draft/review中の版はeditor/adminのみ閲覧可能（設計書⑦ RBAC、⑧ 一般公開はPUBLISHED版のみ）。
 * 公開(publish)操作は別コミットで追加する。
 */
@Controller("admin/ingestion/versions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class IngestionReviewController {
  constructor(
    private readonly listPendingReviewVersionsUsecase: ListPendingReviewVersionsUsecase,
    private readonly getPendingReviewVersionDetailUsecase: GetPendingReviewVersionDetailUsecase,
  ) {}

  @Get()
  async list(
    @Query() query: ListPendingReviewVersionsQueryDto,
  ): Promise<PendingReviewVersionListResponse> {
    const result = await this.listPendingReviewVersionsUsecase.execute({
      cursor: query.cursor,
      limit: query.limit,
    });

    return pendingReviewVersionListResponseSchema.parse({
      items: result.items.map((item) => toSummaryResponse(item)),
      nextCursor: result.nextCursor,
    });
  }

  @Get(":id")
  async detail(
    @Param() params: PendingReviewVersionIdParamDto,
  ): Promise<PendingReviewVersionDetailResponse> {
    const detail = await this.getPendingReviewVersionDetailUsecase.execute(params.id);

    return pendingReviewVersionDetailResponseSchema.parse({
      ...toSummaryResponse(detail),
      fullText: detail.fullText,
      currentPublished: detail.currentPublished
        ? {
            versionId: detail.currentPublished.versionId,
            versionNo: detail.currentPublished.versionNo,
            fullText: detail.currentPublished.fullText,
            effectiveFrom: toDateOnlyString(detail.currentPublished.effectiveFrom),
          }
        : null,
    });
  }
}

function toSummaryResponse(item: PendingReviewVersionSummary) {
  return {
    id: item.id,
    regulationId: item.regulationId,
    regulationTitle: item.regulationTitle,
    jurisdiction: item.jurisdiction,
    type: item.type,
    status: item.status,
    versionNo: item.versionNo,
    effectiveFrom: toDateOnlyString(item.effectiveFrom),
    changeSummary: item.changeSummary,
    createdAt: item.createdAt.toISOString(),
  };
}
