import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetRegulationDetailUsecase } from "../../core/usecases/get-regulation-detail.usecase";
import { ListRegulationsUsecase } from "../../core/usecases/list-regulations.usecase";

import { RegulationsController } from "./regulations.controller";

describe("RegulationsController", () => {
  let controller: RegulationsController;
  const listExecute = jest.fn();
  const detailExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    detailExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegulationsController],
      providers: [
        { provide: ListRegulationsUsecase, useValue: { execute: listExecute } },
        { provide: GetRegulationDetailUsecase, useValue: { execute: detailExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(RegulationsController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs, formatting effectiveDate as a date-only string", async () => {
      listExecute.mockResolvedValue({
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

      expect(listExecute).toHaveBeenCalledWith({
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
      listExecute.mockResolvedValue({
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

  describe("detail", () => {
    it("maps the usecase result to a detail response including the latest version and sections", async () => {
      detailExecute.mockResolvedValue({
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
        latestVersion: {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          versionNo: 2,
          publishedAt: new Date("2026-02-01T00:00:00.000Z"),
          effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
          effectiveTo: null,
          summary: "改正概要",
          changeSummary: "第三条を改正",
          fullText: "第一条 ...",
          sections: [
            {
              id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
              path: "第一条",
              heading: "目的",
              body: "...",
            },
          ],
        },
      });

      const result = await controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a" });

      expect(detailExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a");
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        jurisdiction: { code: "JP", name: "日本" },
        type: "LAW",
        subtype: null,
        title: "医薬品医療機器等法",
        docNumber: "昭和三十五年法律第百四十五号",
        status: "ACTIVE",
        effectiveDate: "2026-01-01",
        sourceUrl: null,
        latestVersion: {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          versionNo: 2,
          publishedAt: "2026-02-01T00:00:00.000Z",
          effectiveFrom: "2026-02-01",
          effectiveTo: null,
          summary: "改正概要",
          changeSummary: "第三条を改正",
          fullText: "第一条 ...",
          sections: [
            {
              id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
              path: "第一条",
              heading: "目的",
              body: "...",
            },
          ],
        },
      });
    });

    it("returns latestVersion as null when the regulation has no versions", async () => {
      detailExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        jurisdiction: { code: "JP", name: "日本" },
        type: "LAW",
        subtype: null,
        title: "医薬品医療機器等法",
        docNumber: null,
        status: "ACTIVE",
        effectiveDate: null,
        sourceUrl: null,
        createdAt: new Date("2026-07-04T00:00:00.000Z"),
        updatedAt: new Date("2026-07-04T00:00:00.000Z"),
        latestVersion: null,
      });

      const result = await controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a" });

      expect(result.latestVersion).toBeNull();
    });

    it("propagates NotFoundException from the usecase", async () => {
      detailExecute.mockRejectedValue(
        new NotFoundException("指定された法規文書が見つかりません。"),
      );

      await expect(
        controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
