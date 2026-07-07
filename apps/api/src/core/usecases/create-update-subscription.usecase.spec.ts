import type { UpdateSubscription } from "../domain/update-subscription.entity";
import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";

import { CreateUpdateSubscriptionUsecase } from "./create-update-subscription.usecase";

describe("CreateUpdateSubscriptionUsecase", () => {
  const subscription: UpdateSubscription = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
    jurisdiction: { code: "JP", name: "日本" },
    regulationType: "NOTICE",
    frequency: "DAILY",
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
    };
    const usecase = new CreateUpdateSubscriptionUsecase(updateSubscriptionRepository);
    return { usecase, updateSubscriptionRepository };
  }

  it("creates a subscription when no duplicate exists", async () => {
    const { usecase, updateSubscriptionRepository } = setup();
    updateSubscriptionRepository.existsForUser.mockResolvedValue(false);
    updateSubscriptionRepository.create.mockResolvedValue(subscription);

    const result = await usecase.execute({
      userId: subscription.userId,
      jurisdiction: "JP",
      regulationType: "NOTICE",
      frequency: "DAILY",
    });

    expect(updateSubscriptionRepository.existsForUser).toHaveBeenCalledWith({
      userId: subscription.userId,
      jurisdictionCode: "JP",
      regulationType: "NOTICE",
      frequency: "DAILY",
    });
    expect(updateSubscriptionRepository.create).toHaveBeenCalledWith({
      userId: subscription.userId,
      jurisdictionCode: "JP",
      regulationType: "NOTICE",
      frequency: "DAILY",
    });
    expect(result).toEqual(subscription);
  });

  it("throws ConflictException when the same subscription already exists", async () => {
    const { usecase, updateSubscriptionRepository } = setup();
    updateSubscriptionRepository.existsForUser.mockResolvedValue(true);

    await expect(
      usecase.execute({ userId: subscription.userId, frequency: "DAILY" }),
    ).rejects.toThrow("指定の条件では既に購読済みです。");
    expect(updateSubscriptionRepository.create).not.toHaveBeenCalled();
  });

  it("supports a global subscription with no jurisdiction/regulationType", async () => {
    const { usecase, updateSubscriptionRepository } = setup();
    updateSubscriptionRepository.existsForUser.mockResolvedValue(false);
    updateSubscriptionRepository.create.mockResolvedValue({
      ...subscription,
      jurisdiction: null,
      regulationType: null,
    });

    await usecase.execute({ userId: subscription.userId, frequency: "WEEKLY" });

    expect(updateSubscriptionRepository.existsForUser).toHaveBeenCalledWith({
      userId: subscription.userId,
      jurisdictionCode: undefined,
      regulationType: undefined,
      frequency: "WEEKLY",
    });
  });
});
