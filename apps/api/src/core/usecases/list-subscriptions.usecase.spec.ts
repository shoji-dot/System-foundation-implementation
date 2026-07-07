import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";

import { ListSubscriptionsUsecase } from "./list-subscriptions.usecase";

describe("ListSubscriptionsUsecase", () => {
  function setup() {
    const updateSubscriptionRepository: jest.Mocked<UpdateSubscriptionRepository> = {
      existsForUser: jest.fn(),
      create: jest.fn(),
      findMatchingUserIds: jest.fn(),
      findManyForUser: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    const usecase = new ListSubscriptionsUsecase(updateSubscriptionRepository);
    return { usecase, updateSubscriptionRepository };
  }

  it("delegates to the repository with the given userId", async () => {
    const { usecase, updateSubscriptionRepository } = setup();
    const expected = [
      {
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        jurisdiction: { code: "JP" as const, name: "日本" },
        regulationType: "NOTICE" as const,
        frequency: "DAILY" as const,
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
      },
    ];
    updateSubscriptionRepository.findManyForUser.mockResolvedValue(expected);

    const result = await usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b");

    expect(updateSubscriptionRepository.findManyForUser).toHaveBeenCalledWith(
      "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
    );
    expect(result).toEqual(expected);
  });
});
