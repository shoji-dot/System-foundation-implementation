import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListNotificationsUsecase } from "../../core/usecases/list-notifications.usecase";

import { NotificationsController } from "./notifications.controller";

describe("NotificationsController", () => {
  let controller: NotificationsController;
  const listExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: ListNotificationsUsecase, useValue: { execute: listExecute } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(NotificationsController);
  });

  describe("list", () => {
    it("uses the authenticated user's id and maps the response, formatting dates as strings", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
            userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
            regulationVersionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
            title: "医療機器の製造販売に関する通知が更新されました",
            body: "本文の変更を検出しました。",
            isRead: false,
            createdAt: new Date("2026-07-05T12:00:00.000Z"),
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      });

      const request = {
        user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b" },
      } as AuthenticatedRequest;

      const result = await controller.list(request, { cursor: undefined, limit: 20 });

      expect(listExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
            regulationVersionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
            title: "医療機器の製造販売に関する通知が更新されました",
            body: "本文の変更を検出しました。",
            isRead: false,
            createdAt: "2026-07-05T12:00:00.000Z",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      });
    });
  });
});
