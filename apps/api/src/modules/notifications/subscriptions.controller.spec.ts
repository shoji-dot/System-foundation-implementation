import { ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateUpdateSubscriptionUsecase } from "../../core/usecases/create-update-subscription.usecase";

import { SubscriptionsController } from "./subscriptions.controller";

describe("SubscriptionsController", () => {
  let controller: SubscriptionsController;
  const createExecute = jest.fn();

  beforeEach(async () => {
    createExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        { provide: CreateUpdateSubscriptionUsecase, useValue: { execute: createExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(SubscriptionsController);
  });

  describe("create", () => {
    it("creates a subscription using the authenticated user's id, mapping the response", async () => {
      createExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        jurisdiction: { code: "JP", name: "日本" },
        regulationType: "NOTICE",
        frequency: "DAILY",
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
      });

      const request = {
        user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b" },
      } as AuthenticatedRequest;

      const result = await controller.create(request, {
        jurisdiction: "JP",
        regulationType: "NOTICE",
        frequency: "DAILY",
      });

      expect(createExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        jurisdiction: "JP",
        regulationType: "NOTICE",
        frequency: "DAILY",
      });
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        jurisdiction: { code: "JP", name: "日本" },
        regulationType: "NOTICE",
        frequency: "DAILY",
        createdAt: "2026-07-05T00:00:00.000Z",
      });
    });

    it("supports a global subscription with no jurisdiction/regulationType filter", async () => {
      createExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        jurisdiction: null,
        regulationType: null,
        frequency: "WEEKLY",
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
      });

      const request = {
        user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b" },
      } as AuthenticatedRequest;

      const result = await controller.create(request, { frequency: "WEEKLY" });

      expect(result.jurisdiction).toBeNull();
      expect(result.regulationType).toBeNull();
    });

    it("propagates ConflictException from the usecase", async () => {
      createExecute.mockRejectedValue(new ConflictException("指定の条件では既に購読済みです。"));

      const request = {
        user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b" },
      } as AuthenticatedRequest;

      await expect(controller.create(request, { frequency: "DAILY" })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
