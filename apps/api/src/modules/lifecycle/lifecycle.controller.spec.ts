import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetLifecycleTemplateDetailUsecase } from "../../core/usecases/get-lifecycle-template-detail.usecase";
import { ListLifecycleTemplatesUsecase } from "../../core/usecases/list-lifecycle-templates.usecase";

import { LifecycleController } from "./lifecycle.controller";

describe("LifecycleController", () => {
  let controller: LifecycleController;
  const listExecute = jest.fn();
  const detailExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    detailExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LifecycleController],
      providers: [
        { provide: ListLifecycleTemplatesUsecase, useValue: { execute: listExecute } },
        { provide: GetLifecycleTemplateDetailUsecase, useValue: { execute: detailExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(LifecycleController);
  });

  describe("list", () => {
    it("maps the usecase result to a response, formatting createdAt as ISO string", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
            jurisdiction: { code: "JP", name: "日本" },
            deviceCategory: "CLASS_II",
            procedureType: "認証",
            status: "PUBLISHED",
            version: 1,
            createdAt: new Date("2026-07-10T00:00:00.000Z"),
          },
        ],
        nextCursor: null,
      });

      const result = await controller.list({
        jurisdiction: "JP",
        deviceCategory: "CLASS_II",
        procedureType: "認証",
        cursor: undefined,
        limit: 20,
      });

      expect(listExecute).toHaveBeenCalledWith({
        jurisdiction: "JP",
        deviceCategory: "CLASS_II",
        procedureType: "認証",
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
            jurisdiction: { code: "JP", name: "日本" },
            deviceCategory: "CLASS_II",
            procedureType: "認証",
            status: "PUBLISHED",
            version: 1,
            createdAt: "2026-07-10T00:00:00.000Z",
          },
        ],
        nextCursor: null,
      });
    });
  });

  describe("detail", () => {
    const baseRequest = { user: { userId: "u1", plan: "PRO" } } as never;

    it("maps the usecase result (already masked/unmasked by the usecase) to a detail response", async () => {
      detailExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        jurisdiction: { code: "JP", name: "日本" },
        deviceCategory: "CLASS_II",
        procedureType: "認証",
        status: "PUBLISHED",
        version: 1,
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
        steps: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
            phase: {
              id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
              code: "SUBMISSION",
              name: "申請",
              order: 8,
            },
            name: "認証申請書の提出",
            order: 1,
            durationMinDays: 30,
            durationMaxDays: 60,
            costMinJpy: 500000,
            costMaxJpy: 1000000,
            requiredDocuments: ["認証申請書"],
            requiredTests: ["生物学的安全性試験"],
            relatedRegulationIds: ["018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d"],
            pmdaResourceUrls: ["https://www.pmda.go.jp/example"],
            notes: "備考",
            sourceRefs: [{ title: "薬機法施行規則", url: "https://example.com/law" }],
          },
        ],
      });

      const result = await controller.detail(
        { id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a" },
        baseRequest,
      );

      expect(detailExecute).toHaveBeenCalledWith({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        plan: "PRO",
      });
      expect(result.steps[0]).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        phase: { code: "SUBMISSION", name: "申請", order: 8 },
        name: "認証申請書の提出",
        order: 1,
        durationMinDays: 30,
        durationMaxDays: 60,
        costMinJpy: 500000,
        costMaxJpy: 1000000,
        requiredDocuments: ["認証申請書"],
        requiredTests: ["生物学的安全性試験"],
        relatedRegulationIds: ["018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d"],
        pmdaResourceUrls: ["https://www.pmda.go.jp/example"],
        notes: "備考",
        sourceRefs: [{ title: "薬機法施行規則", url: "https://example.com/law" }],
      });
    });

    it("propagates NotFoundException from the usecase", async () => {
      detailExecute.mockRejectedValue(
        new NotFoundException("指定された工程マスタが見つからないか、未公開です。"),
      );

      await expect(
        controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a" }, baseRequest),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
