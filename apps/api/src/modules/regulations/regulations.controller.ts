import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type {
  RegulationDetailResponse,
  RegulationListResponse,
  RegulationVersionListResponse,
} from "@yakuji/shared";
import {
  regulationDetailResponseSchema,
  regulationListResponseSchema,
  regulationVersionListResponseSchema,
} from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import { GetRegulationDetailUsecase } from "../../core/usecases/get-regulation-detail.usecase";
import { ListRegulationVersionsUsecase } from "../../core/usecases/list-regulation-versions.usecase";
import { ListRegulationsUsecase } from "../../core/usecases/list-regulations.usecase";

import { ListRegulationVersionsQueryDto } from "./dto/list-regulation-versions-query.dto";
import { ListRegulationsQueryDto } from "./dto/list-regulations-query.dto";
import { RegulationIdParamDto } from "./dto/regulation-id-param.dto";

/**
 * 設計書⑤ GET /api/v1/regulations、/regulations/:id、/regulations/:id/versions。
 * 設計書⑬画面遷移: S06/S07はS02ログイン後のみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("regulations")
@UseGuards(JwtAuthGuard)
export class RegulationsController {
  constructor(
    private readonly listRegulationsUsecase: ListRegulationsUsecase,
    private readonly getRegulationDetailUsecase: GetRegulationDetailUsecase,
    private readonly listRegulationVersionsUsecase: ListRegulationVersionsUsecase,
  ) {}

  @Get()
  async list(@Query() query: ListRegulationsQueryDto): Promise<RegulationListResponse> {
    const result = await this.listRegulationsUsecase.execute({
      jurisdiction: query.jurisdiction,
      type: query.type,
      q: query.q,
      cursor: query.cursor,
      limit: query.limit,
    });

    return regulationListResponseSchema.parse({
      items: result.items.map((regulation) => ({
        id: regulation.id,
        jurisdiction: regulation.jurisdiction,
        type: regulation.type,
        subtype: regulation.subtype,
        title: regulation.title,
        docNumber: regulation.docNumber,
        status: regulation.status,
        effectiveDate: toDateOnlyString(regulation.effectiveDate),
        sourceUrl: regulation.sourceUrl,
      })),
      nextCursor: result.nextCursor,
    });
  }

  @Get(":id")
  async detail(@Param() params: RegulationIdParamDto): Promise<RegulationDetailResponse> {
    const detail = await this.getRegulationDetailUsecase.execute(params.id);

    return regulationDetailResponseSchema.parse({
      id: detail.id,
      jurisdiction: detail.jurisdiction,
      type: detail.type,
      subtype: detail.subtype,
      title: detail.title,
      docNumber: detail.docNumber,
      status: detail.status,
      effectiveDate: toDateOnlyString(detail.effectiveDate),
      sourceUrl: detail.sourceUrl,
      latestVersion: detail.latestVersion
        ? {
            id: detail.latestVersion.id,
            versionNo: detail.latestVersion.versionNo,
            publishedAt: detail.latestVersion.publishedAt.toISOString(),
            effectiveFrom: toDateOnlyString(detail.latestVersion.effectiveFrom),
            effectiveTo: toDateOnlyString(detail.latestVersion.effectiveTo),
            summary: detail.latestVersion.summary,
            changeSummary: detail.latestVersion.changeSummary,
            fullText: detail.latestVersion.fullText,
            sections: detail.latestVersion.sections,
          }
        : null,
    });
  }

  @Get(":id/versions")
  async versions(
    @Param() params: RegulationIdParamDto,
    @Query() query: ListRegulationVersionsQueryDto,
  ): Promise<RegulationVersionListResponse> {
    const result = await this.listRegulationVersionsUsecase.execute({
      regulationId: params.id,
      cursor: query.cursor,
      limit: query.limit,
    });

    return regulationVersionListResponseSchema.parse({
      items: result.items.map((version) => ({
        id: version.id,
        versionNo: version.versionNo,
        publishedAt: version.publishedAt.toISOString(),
        effectiveFrom: toDateOnlyString(version.effectiveFrom),
        effectiveTo: toDateOnlyString(version.effectiveTo),
        summary: version.summary,
        changeSummary: version.changeSummary,
      })),
      nextCursor: result.nextCursor,
    });
  }
}
