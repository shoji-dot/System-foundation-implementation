import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListUpdatesUsecase } from "../../core/usecases/list-updates.usecase";

import { UpdatesController } from "./updates.controller";

describe("UpdatesController", () => {
  let controller: UpdatesController;
  const listExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdatesController],
      providers: [{ provide: ListUpdatesUsecase, useValue: { execute: listExecute } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UpdatesController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs, formatting date fields", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
            regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
            jurisdiction: { code: "JP", name: "日本" },
            type: "NOTICE",
            title: "医療機器の承認申請について",
            docNumber: "薬生機発0101第1号",
            versionNo: 2,
            changeSummary: "第3項を改正",
            publishedAt: new Date("2026-07-05T00:00:00.000Z"),
            effectiveFrom: new Date("2026-07-05T00:00:00.000Z"),
            regulationStatus: "AMENDED",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
      });

      const result = await controller.list({
        since: undefined,
        jurisdiction: "JP",
        type: "NOTICE",
        cursor: undefined,
        limit: 20,
      });

      expect(listExecute).toHaveBeenCalledWith({
        since: undefined,
        jurisdiction: "JP",
        type: "NOTICE",
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
            regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
            jurisdiction: { code: "JP", name: "日本" },
            type: "NOTICE",
            title: "医療機器の承認申請について",
            docNumber: "薬生機発0101第1号",
            versionNo: 2,
            changeSummary: "第3項を改正",
            publishedAt: "2026-07-05T00:00:00.000Z",
            effectiveFrom: "2026-07-05",
            regulationStatus: "AMENDED",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
      });
    });

    it("returns an empty list with a null nextCursor when there is nothing new", async () => {
      listExecute.mockResolvedValue({ items: [], nextCursor: null });

      const result = await controller.list({ limit: 20 });

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });
  });
});
