import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListRegulationsUsecase } from "../../core/usecases/list-regulations.usecase";

import { RegulationsController } from "./regulations.controller";

describe("RegulationsController", () => {
  let controller: RegulationsController;
  const execute = jest.fn();

  beforeEach(async () => {
    execute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegulationsController],
      providers: [{ provide: ListRegulationsUsecase, useValue: { execute } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(RegulationsController);
  });

  it("maps the usecase result to response DTOs, formatting effectiveDate as a date-only string", async () => {
    execute.mockResolvedValue({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
          jurisdiction: { code: "JP", name: "日本" },
          type: "LAW",
          subtype: null,
          title: "医薬品医療機器等法",
          docNumber: "昭和三十五年法律第百四十五号",
          status: "ACTIVE",
          effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
          sourceUrl: null,
          createdAt: new Date("2026-07-04T00:00:00.000Z"),
          updatedAt: new Date("2026-07-04T00:00:00.000Z"),
        },
      ],
      nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    });

    const result = await controller.list({
      jurisdiction: "JP",
      type: "LAW",
      q: undefined,
      cursor: undefined,
      limit: 20,
    });

    expect(execute).toHaveBeenCalledWith({
      jurisdiction: "JP",
      type: "LAW",
      q: undefined,
      cursor: undefined,
      limit: 20,
    });
    expect(result).toEqual({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
          jurisdiction: { code: "JP", name: "日本" },
          type: "LAW",
          subtype: null,
          title: "医薬品医療機器等法",
          docNumber: "昭和三十五年法律第百四十五号",
          status: "ACTIVE",
          effectiveDate: "2026-01-01",
          sourceUrl: null,
        },
      ],
      nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    });
  });

  it("returns a null effectiveDate as null", async () => {
    execute.mockResolvedValue({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
          jurisdiction: { code: "JP", name: "日本" },
          type: "NOTICE",
          subtype: null,
          title: "通知",
          docNumber: null,
          status: "ACTIVE",
          effectiveDate: null,
          sourceUrl: null,
          createdAt: new Date("2026-07-04T00:00:00.000Z"),
          updatedAt: new Date("2026-07-04T00:00:00.000Z"),
        },
      ],
      nextCursor: null,
    });

    const result = await controller.list({ limit: 20 });

    expect(result.items[0]?.effectiveDate).toBeNull();
    expect(result.nextCursor).toBeNull();
  });
});
