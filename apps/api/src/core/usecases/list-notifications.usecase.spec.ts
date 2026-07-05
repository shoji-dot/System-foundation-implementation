import type { NotificationRepository } from "../domain/notification.repository";

import { ListNotificationsUsecase } from "./list-notifications.usecase";

describe("ListNotificationsUsecase", () => {
  function setup() {
    const notificationRepository: jest.Mocked<NotificationRepository> = {
      createMany: jest.fn(),
      findManyForUser: jest.fn(),
    };
    const usecase = new ListNotificationsUsecase(notificationRepository);
    return { usecase, notificationRepository };
  }

  it("delegates to the repository with the given userId/cursor/limit", async () => {
    const { usecase, notificationRepository } = setup();
    const expected = {
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
      nextCursor: null,
    };
    notificationRepository.findManyForUser.mockResolvedValue(expected);

    const result = await usecase.execute({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      cursor: undefined,
      limit: 20,
    });

    expect(notificationRepository.findManyForUser).toHaveBeenCalledWith({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      cursor: undefined,
      limit: 20,
    });
    expect(result).toEqual(expected);
  });
});
