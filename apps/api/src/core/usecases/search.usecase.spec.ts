import type { RegulationSearchResult } from "../domain/search-result.entity";
import type { SearchRepository } from "../domain/search.repository";

import { SearchUsecase } from "./search.usecase";

describe("SearchUsecase", () => {
  const regulationResult: RegulationSearchResult = {
    type: "regulation",
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e8a",
    jurisdiction: { code: "JP", name: "日本" },
    regulationType: "LAW",
    title: "医薬品医療機器等法",
    docNumber: "昭和三十五年法律第百四十五号",
    status: "ACTIVE",
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
  };

  function setup() {
    const searchRepository: jest.Mocked<SearchRepository> = {
      search: jest.fn(),
    };
    const usecase = new SearchUsecase(searchRepository);
    return { usecase, searchRepository };
  }

  it("normalizes filters and delegates to the repository", async () => {
    const { usecase, searchRepository } = setup();
    searchRepository.search.mockResolvedValue({ items: [regulationResult], nextCursor: null });

    const result = await usecase.execute({
      q: "  医薬品  ",
      scope: "regulation",
      cursor: undefined,
      limit: 20,
    });

    expect(searchRepository.search).toHaveBeenCalledWith({
      q: "医薬品",
      scope: "regulation",
      cursor: undefined,
      limit: 20,
    });
    expect(result.items).toEqual([regulationResult]);
    expect(result.nextCursor).toBeNull();
  });

  it("omits q entirely when it is blank after trimming", async () => {
    const { usecase, searchRepository } = setup();
    searchRepository.search.mockResolvedValue({ items: [], nextCursor: null });

    await usecase.execute({ q: "   ", scope: "all", limit: 20 });

    expect(searchRepository.search).toHaveBeenCalledWith({
      q: undefined,
      scope: "all",
      cursor: undefined,
      limit: 20,
    });
  });
});
