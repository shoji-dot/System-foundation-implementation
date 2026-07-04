import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SearchUsecase } from "../../core/usecases/search.usecase";

import { SearchController } from "./search.controller";

describe("SearchController", () => {
  let controller: SearchController;
  const searchExecute = jest.fn();

  beforeEach(async () => {
    searchExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchUsecase, useValue: { execute: searchExecute } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(SearchController);
  });

  it("maps a regulation result, formatting effectiveDate as a date-only string", async () => {
    searchExecute.mockResolvedValue({
      items: [
        {
          type: "regulation",
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e8a",
          jurisdiction: { code: "JP", name: "日本" },
          regulationType: "LAW",
          title: "医薬品医療機器等法",
          docNumber: "昭和三十五年法律第百四十五号",
          status: "ACTIVE",
          effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
      nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e8a",
    });

    const result = await controller.search({
      q: "医薬品",
      scope: "regulation",
      cursor: undefined,
      limit: 20,
      tag: undefined,
    });

    expect(searchExecute).toHaveBeenCalledWith({
      q: "医薬品",
      scope: "regulation",
      cursor: undefined,
      limit: 20,
    });
    expect(result).toEqual({
      items: [
        {
          type: "regulation",
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e8a",
          jurisdiction: { code: "JP", name: "日本" },
          regulationType: "LAW",
          title: "医薬品医療機器等法",
          docNumber: "昭和三十五年法律第百四十五号",
          status: "ACTIVE",
          effectiveDate: "2026-01-01",
        },
      ],
      nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e8a",
    });
  });

  it("maps a classification result", async () => {
    searchExecute.mockResolvedValue({
      items: [
        {
          type: "classification",
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
          jurisdiction: { code: "JP", name: "日本" },
          scheme: "JMDN",
          code: "35282000",
          name: "汎用電子内視鏡",
          class: "III",
        },
      ],
      nextCursor: null,
    });

    const result = await controller.search({ scope: "jmdn", limit: 20 });

    expect(result).toEqual({
      items: [
        {
          type: "classification",
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
          jurisdiction: { code: "JP", name: "日本" },
          scheme: "JMDN",
          code: "35282000",
          name: "汎用電子内視鏡",
          class: "III",
        },
      ],
      nextCursor: null,
    });
  });

  it("returns a null effectiveDate as null for regulation results", async () => {
    searchExecute.mockResolvedValue({
      items: [
        {
          type: "regulation",
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e8b",
          jurisdiction: { code: "JP", name: "日本" },
          regulationType: "NOTICE",
          title: "通知",
          docNumber: null,
          status: "ACTIVE",
          effectiveDate: null,
        },
      ],
      nextCursor: null,
    });

    const result = await controller.search({ scope: "all", limit: 20 });

    expect(result.items[0]).toMatchObject({ effectiveDate: null });
  });
});
