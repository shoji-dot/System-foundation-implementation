import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetLearningProgressSummaryUsecase } from "../../core/usecases/get-learning-progress-summary.usecase";
import { ListLearningProgressUsecase } from "../../core/usecases/list-learning-progress.usecase";
import { RecordProgressUsecase } from "../../core/usecases/record-progress.usecase";

import { ProgressController } from "./progress.controller";

describe("ProgressController", () => {
  let controller: ProgressController;
  const recordExecute = jest.fn();
  const summaryExecute = jest.fn();
  const listExecute = jest.fn();

  const request = {
    user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f", email: "user@example.com" },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    recordExecute.mockReset();
    summaryExecute.mockReset();
    listExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        { provide: RecordProgressUsecase, useValue: { execute: recordExecute } },
        { provide: GetLearningProgressSummaryUsecase, useValue: { execute: summaryExecute } },
        { provide: ListLearningProgressUsecase, useValue: { execute: listExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ProgressController);
  });

  describe("record", () => {
    it("passes the authenticated userId and maps the usecase result to a response", async () => {
      recordExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        status: "COMPLETED",
        score: 80,
        completedAt: new Date("2026-07-04T00:00:00.000Z"),
      });

      const result = await controller.record(request, {
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        status: "COMPLETED",
        score: 80,
      });

      expect(recordExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        status: "COMPLETED",
        score: 80,
      });
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        status: "COMPLETED",
        score: 80,
        completedAt: "2026-07-04T00:00:00.000Z",
      });
    });

    it("returns null completedAt when the progress is not completed", async () => {
      recordExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6b",
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        status: "IN_PROGRESS",
        score: null,
        completedAt: null,
      });

      const result = await controller.record(request, {
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        status: "IN_PROGRESS",
      });

      expect(result.score).toBeNull();
      expect(result.completedAt).toBeNull();
    });
  });

  describe("summary", () => {
    it("uses the authenticated user's id and returns the aggregated counts", async () => {
      summaryExecute.mockResolvedValue({ totalLessons: 10, completedCount: 3, inProgressCount: 2 });

      const result = await controller.summary(request);

      expect(summaryExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f");
      expect(result).toEqual({ totalLessons: 10, completedCount: 3, inProgressCount: 2 });
    });
  });

  describe("list", () => {
    it("uses the authenticated user's id and maps the usecase result to response DTOs", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
            status: "COMPLETED",
            score: 80,
            completedAt: new Date("2026-07-04T00:00:00.000Z"),
            lessonTitle: "薬機法の基礎",
            courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e10",
            courseTitle: "企画・開発",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });

      const result = await controller.list(request, { cursor: undefined, limit: 20 });

      expect(listExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
            status: "COMPLETED",
            score: 80,
            completedAt: "2026-07-04T00:00:00.000Z",
            lessonTitle: "薬機法の基礎",
            courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e10",
            courseTitle: "企画・開発",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
      });
    });
  });
});
