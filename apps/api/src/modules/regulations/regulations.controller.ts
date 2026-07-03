import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { RegulationListResponse } from "@yakuji/shared";
import { regulationListResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListRegulationsUsecase } from "../../core/usecases/list-regulations.usecase";

import { ListRegulationsQueryDto } from "./dto/list-regulations-query.dto";

/**
 * 設計書⑤ GET /api/v1/regulations。
 * 設計書⑬画面遷移: S06/S07はS02ログイン後のみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("regulations")
@UseGuards(JwtAuthGuard)
export class RegulationsController {
  constructor(private readonly listRegulationsUsecase: ListRegulationsUsecase) {}

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
        effectiveDate: regulation.effectiveDate
          ? regulation.effectiveDate.toISOString().slice(0, 10)
          : null,
        sourceUrl: regulation.sourceUrl,
      })),
      nextCursor: result.nextCursor,
    });
  }
}
