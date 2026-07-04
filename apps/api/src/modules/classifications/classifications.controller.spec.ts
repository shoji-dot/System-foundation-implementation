import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetClassificationMappingsUsecase } from "../../core/usecases/get-classification-mappings.usecase";
import { ListClassificationsUsecase } from "../../core/usecases/list-classifications.usecase";

import { ClassificationsController } from "./classifications.controller";

describe("ClassificationsController", () => {
  let controller: ClassificationsController;
  const listExecute = jest.fn();
  const mappingsExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    mappingsExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassificationsController],
      providers: [
        { provide: ListClassificationsUsecase, useValue: { execute: listExecute } },
        { provide: GetClassificationMappingsUsecase, useValue: { execute: mappingsExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ClassificationsController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            jurisdiction: { code: "JP", name: "日本" },
            scheme: "JMDN",
            code: "35282000",
            name: "汎用電子内視鏡",
            class: "III",
            definition: "体腔内又は体内管腔内を観察するために用いる電子内視鏡。",
            createdAt: new Date("2026-07-04T00:00:00.000Z"),
            updatedAt: new Date("2026-07-04T00:00:00.000Z"),
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });

      const result = await controller.list({
        scheme: "JMDN",
        jurisdiction: "JP",
        q: undefined,
        cursor: undefined,
        limit: 20,
      });

      expect(listExecute).toHaveBeenCalledWith({
        scheme: "JMDN",
        jurisdiction: "JP",
        q: undefined,
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            jurisdiction: { code: "JP", name: "日本" },
            scheme: "JMDN",
            code: "35282000",
            name: "汎用電子内視鏡",
            class: "III",
            definition: "体腔内又は体内管腔内を観察するために用いる電子内視鏡。",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });
    });

    it("returns null class/definition as null", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6b",
            jurisdiction: { code: "JP", name: "日本" },
            scheme: "JMDN",
            code: "12345678",
            name: "未分類機器",
            class: null,
            definition: null,
            createdAt: new Date("2026-07-04T00:00:00.000Z"),
            updatedAt: new Date("2026-07-04T00:00:00.000Z"),
          },
        ],
        nextCursor: null,
      });

      const result = await controller.list({ limit: 20 });

      expect(result.items[0]?.class).toBeNull();
      expect(result.items[0]?.definition).toBeNull();
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("mappings", () => {
    it("maps the usecase result to a mapping list response", async () => {
      mappingsExecute.mockResolvedValue([
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e7a",
          confidence: 0.92,
          classification: {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e7b",
            jurisdiction: { code: "US", name: "米国" },
            scheme: "FDA_PRODUCT_CODE",
            code: "ABC",
            name: "Flexible Endoscope",
            class: "II",
            definition: null,
            createdAt: new Date("2026-07-04T00:00:00.000Z"),
            updatedAt: new Date("2026-07-04T00:00:00.000Z"),
          },
        },
      ]);

      const result = await controller.mappings({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a" });

      expect(mappingsExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a");
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e7a",
            confidence: 0.92,
            classification: {
              id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e7b",
              jurisdiction: { code: "US", name: "米国" },
              scheme: "FDA_PRODUCT_CODE",
              code: "ABC",
              name: "Flexible Endoscope",
              class: "II",
              definition: null,
            },
          },
        ],
      });
    });

    it("propagates NotFoundException from the usecase", async () => {
      mappingsExecute.mockRejectedValue(
        new NotFoundException("指定された機器分類が見つかりません。"),
      );

      await expect(
        controller.mappings({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
