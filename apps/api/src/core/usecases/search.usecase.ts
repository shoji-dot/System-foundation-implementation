import { Inject, Injectable } from "@nestjs/common";

import type { SearchFilters, SearchRepository, SearchResult } from "../domain/search.repository";
import { SEARCH_REPOSITORY } from "../domain/search.repository";

export interface SearchInput {
  q?: string;
  scope: SearchFilters["scope"];
  cursor?: string;
  limit: number;
}

/**
 * 統合検索ユースケース（設計書⑤⑩ GET /api/v1/search、S05）。
 */
@Injectable()
export class SearchUsecase {
  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: SearchRepository,
  ) {}

  async execute(input: SearchInput): Promise<SearchResult> {
    const q = input.q?.trim();

    return this.searchRepository.search({
      q: q ? q : undefined,
      scope: input.scope,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
