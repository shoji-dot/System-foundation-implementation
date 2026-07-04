import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { SearchResponse, SearchResultItemResponse } from "@yakuji/shared";
import { searchResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import type { SearchResultItem } from "../../core/domain/search-result.entity";
import { SearchUsecase } from "../../core/usecases/search.usecase";

import { SearchQueryDto } from "./dto/search-query.dto";

/**
 * 設計書⑤⑩ GET /api/v1/search（S05 統合検索）。
 * 設計書⑬画面遷移: S05はS04(ホーム)ログイン後のみ到達するため、JwtAuthGuardで保護する。
 * suggest（GET /api/v1/search/suggest）は検索ログ+trgm類似が前提のため、統合検索「基本」の対象外として今回は実装しない。
 */
@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchUsecase: SearchUsecase) {}

  @Get()
  async search(@Query() query: SearchQueryDto): Promise<SearchResponse> {
    const result = await this.searchUsecase.execute({
      q: query.q,
      scope: query.scope,
      cursor: query.cursor,
      limit: query.limit,
    });

    return searchResponseSchema.parse({
      items: result.items.map((item) => toResponseItem(item)),
      nextCursor: result.nextCursor,
    });
  }
}

function toResponseItem(item: SearchResultItem): SearchResultItemResponse {
  if (item.type === "regulation") {
    return {
      type: "regulation",
      id: item.id,
      jurisdiction: item.jurisdiction,
      regulationType: item.regulationType,
      title: item.title,
      docNumber: item.docNumber,
      status: item.status,
      effectiveDate: toDateOnlyString(item.effectiveDate),
    };
  }

  return {
    type: "classification",
    id: item.id,
    jurisdiction: item.jurisdiction,
    scheme: item.scheme,
    code: item.code,
    name: item.name,
    class: item.class,
  };
}
