import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { UpdateFeedListResponse } from "@yakuji/shared";
import { updateFeedListResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import { ListUpdatesUsecase } from "../../core/usecases/list-updates.usecase";

import { ListUpdatesQueryDto } from "./dto/list-updates-query.dto";

/**
 * 設計書⑤ GET /api/v1/updates（薬事情報更新フィード、S04/S17）。
 * 設計書⑬画面遷移: S17はS02ログイン後のみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("updates")
@UseGuards(JwtAuthGuard)
export class UpdatesController {
  constructor(private readonly listUpdatesUsecase: ListUpdatesUsecase) {}

  @Get()
  async list(@Query() query: ListUpdatesQueryDto): Promise<UpdateFeedListResponse> {
    const result = await this.listUpdatesUsecase.execute({
      since: query.since,
      jurisdiction: query.jurisdiction,
      type: query.type,
      cursor: query.cursor,
      limit: query.limit,
    });

    return updateFeedListResponseSchema.parse({
      items: result.items.map((item) => ({
        versionId: item.versionId,
        regulationId: item.regulationId,
        jurisdiction: item.jurisdiction,
        type: item.type,
        title: item.title,
        docNumber: item.docNumber,
        versionNo: item.versionNo,
        changeSummary: item.changeSummary,
        publishedAt: item.publishedAt.toISOString(),
        effectiveFrom: toDateOnlyString(item.effectiveFrom),
        regulationStatus: item.regulationStatus,
      })),
      nextCursor: result.nextCursor,
    });
  }
}
