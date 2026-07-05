import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetLessonDetailUsecase } from "../../core/usecases/get-lesson-detail.usecase";
import { ListLessonsUsecase } from "../../core/usecases/list-lessons.usecase";

import { LessonsController } from "./lessons.controller";

describe("LessonsController", () => {
  let controller: LessonsController;
  const listExecute = jest.fn();
  const detailExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    detailExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        { provide: ListLessonsUsecase, useValue: { execute: listExecute } },
        { provide: GetLessonDetailUsecase, useValue: { execute: detailExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(LessonsController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
            title: "薬機法の全体像",
            order: 0,
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });

      const result = await controller.list({
        courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        cursor: undefined,
        limit: 20,
      });

      expect(listExecute).toHaveBeenCalledWith({
        courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
            title: "薬機法の全体像",
            order: 0,
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });
    });

    it("returns null nextCursor when there is no next page", async () => {
      listExecute.mockResolvedValue({ items: [], nextCursor: null });

      const result = await controller.list({ limit: 20 });

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("detail", () => {
    it("maps the usecase result to a lesson detail response", async () => {
      detailExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
        courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        title: "薬機法の全体像",
        body: "本レッスンでは薬機法の全体像を学びます。",
        order: 0,
        createdAt: new Date("2026-07-04T00:00:00.000Z"),
        updatedAt: new Date("2026-07-04T00:00:00.000Z"),
      });

      const result = await controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a" });

      expect(detailExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a");
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
        courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        title: "薬機法の全体像",
        order: 0,
        body: "本レッスンでは薬機法の全体像を学びます。",
      });
    });

    it("propagates NotFoundException from the usecase", async () => {
      detailExecute.mockRejectedValue(new NotFoundException("指定されたレッスンが見つかりません。"));

      await expect(
        controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
