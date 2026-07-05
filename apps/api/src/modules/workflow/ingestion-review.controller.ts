import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type {
  PendingReviewVersionDetailResponse,
  PendingReviewVersionListResponse,
  PublishPendingReviewVersionResponse,
} from "@yakuji/shared";
import {
  pendingReviewVersionDetailResponseSchema,
  pendingReviewVersionListResponseSchema,
  publishPendingReviewVersionResponseSchema,
} from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import type { PendingReviewVersionSummary } from "../../core/domain/regulation-ingestion.repository";
import { GetPendingReviewVersionDetailUsecase } from "../../core/usecases/get-pending-review-version-detail.usecase";
import { ListPendingReviewVersionsUsecase } from "../../core/usecases/list-pending-review-versions.usecase";
import { PublishRegulationVersionUsecase } from "../../core/usecases/publish-regulation-version.usecase";

import { ListPendingReviewVersionsQueryDto } from "./dto/list-pending-review-versions-query.dto";
import { PendingReviewVersionIdParamDto } from "./dto/pending-review-version-id-param.dto";

/**
 * 設計書⑫ S20（管理: 取込レビュー）GET /api/v1/admin/ingestion/versions、/admin/ingestion/versions/:id、
 * POST /admin/ingestion/versions/:id/publish。
 * draft/review中の版・公開操作はeditor/adminのみ（設計書⑦ RBAC、⑧ 一般公開はPUBLISHED版のみ）。
 */
@Controller("admin/ingestion/versions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class IngestionReviewController {
  constructor(
    private readonly listPendingReviewVersionsUsecase: ListPendingReviewVersionsUsecase,
    private readonly getPendingReviewVersionDetailUsecase: GetPendingReviewVersionDetailUsecase,
    private readonly publishRegulationVersionUsecase: PublishRegulationVersionUsecase,
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

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param() params: PendingReviewVersionIdParamDto,
  ): Promise<PublishPendingReviewVersionResponse> {
    const result = await this.publishRegulationVersionUsecase.execute(params.id);

    return publishPendingReviewVersionResponseSchema.parse({
      regulationId: result.regulationId,
      versionId: result.versionId,
      versionNo: result.versionNo,
      status: "PUBLISHED",
      publishedAt: result.publishedAt.toISOString(),
      effectiveFrom: toDateOnlyString(result.effectiveFrom),
      regulationStatus: result.regulationStatus,
      closedPreviousVersion: result.closedPreviousVersion
        ? {
            versionId: result.closedPreviousVersion.versionId,
            effectiveTo: toDateOnlyString(result.closedPreviousVersion.effectiveTo),
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
