import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RecordProgressUsecase } from "../../core/usecases/record-progress.usecase";

import { ProgressController } from "./progress.controller";

describe("ProgressController", () => {
  let controller: ProgressController;
  const recordExecute = jest.fn();

  const request = {
    user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f", email: "user@example.com" },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    recordExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [{ provide: RecordProgressUsecase, useValue: { execute: recordExecute } }],
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
});
