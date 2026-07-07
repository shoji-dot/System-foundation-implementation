import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetCourseDetailUsecase } from "../../core/usecases/get-course-detail.usecase";
import { ListCoursesUsecase } from "../../core/usecases/list-courses.usecase";

import { CoursesController } from "./courses.controller";

describe("CoursesController", () => {
  let controller: CoursesController;
  const listExecute = jest.fn();
  const detailExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    detailExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: ListCoursesUsecase, useValue: { execute: listExecute } },
        { provide: GetCourseDetailUsecase, useValue: { execute: detailExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CoursesController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            title: "企画・開発",
            description: "医療機器の企画・開発フェーズにおける薬事の基礎",
            order: 0,
            createdAt: new Date("2026-07-04T00:00:00.000Z"),
            updatedAt: new Date("2026-07-04T00:00:00.000Z"),
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });

      const result = await controller.list({ cursor: undefined, limit: 20 });

      expect(listExecute).toHaveBeenCalledWith({ cursor: undefined, limit: 20 });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            title: "企画・開発",
            description: "医療機器の企画・開発フェーズにおける薬事の基礎",
            order: 0,
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });
    });

    it("returns null description and null nextCursor when there is no next page", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6b",
            title: "市販後",
            description: null,
            order: 1,
            createdAt: new Date("2026-07-04T00:00:00.000Z"),
            updatedAt: new Date("2026-07-04T00:00:00.000Z"),
          },
        ],
        nextCursor: null,
      });

      const result = await controller.list({ limit: 20 });

      expect(result.items[0]?.description).toBeNull();
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("detail", () => {
    it("maps the usecase result to a response DTO", async () => {
      detailExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
        title: "企画・開発",
        description: "医療機器の企画・開発フェーズにおける薬事の基礎",
        order: 0,
        createdAt: new Date("2026-07-04T00:00:00.000Z"),
        updatedAt: new Date("2026-07-04T00:00:00.000Z"),
      });

      const result = await controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a" });

      expect(detailExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a");
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
        title: "企画・開発",
        description: "医療機器の企画・開発フェーズにおける薬事の基礎",
        order: 0,
      });
    });

    it("propagates NotFoundException from the usecase", async () => {
      detailExecute.mockRejectedValue(new NotFoundException("指定された学習コースが見つかりません。"));

      await expect(
        controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
