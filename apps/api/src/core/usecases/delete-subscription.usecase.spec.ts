import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";

import { DeleteSubscriptionUsecase } from "./delete-subscription.usecase";

describe("DeleteSubscriptionUsecase", () => {
  const subscription = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
    jurisdiction: null,
    regulationType: null,
    frequency: "DAILY" as const,
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
  };

  function setup() {
    const updateSubscriptionRepository: jest.Mocked<UpdateSubscriptionRepository> = {
      existsForUser: jest.fn(),
      create: jest.fn(),
      findMatchingUserIds: jest.fn(),
      findManyForUser: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      countForUser: jest.fn(),
    };
    const usecase = new DeleteSubscriptionUsecase(updateSubscriptionRepository);
    return { usecase, updateSubscriptionRepository };
  }

  it("deletes the subscription when it belongs to the requesting user", async () => {
    const { usecase, updateSubscriptionRepository } = setup();
    updateSubscriptionRepository.findById.mockResolvedValue(subscription);

    await usecase.execute({ userId: subscription.userId, subscriptionId: subscription.id });

    expect(updateSubscriptionRepository.delete).toHaveBeenCalledWith(subscription.id);
  });

  it("throws NotFoundException when the subscription does not exist", async () => {
    const { usecase, updateSubscriptionRepository } = setup();
    updateSubscriptionRepository.findById.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId: subscription.userId, subscriptionId: subscription.id }),
    ).rejects.toThrow("指定された購読が見つかりません。");
    expect(updateSubscriptionRepository.delete).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when the subscription belongs to another user", async () => {
    const { usecase, updateSubscriptionRepository } = setup();
    updateSubscriptionRepository.findById.mockResolvedValue(subscription);

    await expect(
      usecase.execute({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
        subscriptionId: subscription.id,
      }),
    ).rejects.toThrow("指定された購読が見つかりません。");
    expect(updateSubscriptionRepository.delete).not.toHaveBeenCalled();
  });
});
