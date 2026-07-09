import type { BillingSubscription } from "../domain/billing-subscription.entity";
import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { RevokeComplimentarySubscriptionUsecase } from "./revoke-complimentary-subscription.usecase";

describe("RevokeComplimentarySubscriptionUsecase", () => {
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a";

  const user: User = {
    id: userId,
    email: "user@example.com",
    passwordHash: "hashed",
    name: "User",
    locale: "ja",
    systemRole: "USER",
    plan: "ENTERPRISE",
    profession: null,
    interestedJurisdictions: [],
    onboardingCompletedAt: null,
    createdAt: new Date("2026-07-09T00:00:00.000Z"),
    updatedAt: new Date("2026-07-09T00:00:00.000Z"),
  };

  const revokedSubscription: BillingSubscription = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    userId,
    organizationId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    plan: "ENTERPRISE",
    status: "CANCELED",
    source: "COMPLIMENTARY",
    currentPeriodEnd: null,
    seats: 1,
    createdAt: new Date("2026-07-09T00:00:00.000Z"),
    updatedAt: new Date("2026-07-09T00:00:00.000Z"),
  };

  function setup() {
    const userRepository: jest.Mocked<UserRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      updateRole: jest.fn(),
      updatePlan: jest.fn(),
      completeOnboarding: jest.fn(),
      updateProfile: jest.fn(),
    };
    const billingSubscriptionRepository: jest.Mocked<BillingSubscriptionRepository> = {
      upsertFromStripe: jest.fn(),
      findStripeCustomerId: jest.fn(),
      upsertComplimentary: jest.fn(),
      revokeComplimentary: jest.fn(),
    };
    const usecase = new RevokeComplimentarySubscriptionUsecase(
      userRepository,
      billingSubscriptionRepository,
    );
    return { usecase, userRepository, billingSubscriptionRepository };
  }

  it("revokes the complimentary subscription and resets users.plan to FREE", async () => {
    const { usecase, userRepository, billingSubscriptionRepository } = setup();
    userRepository.findById.mockResolvedValue(user);
    billingSubscriptionRepository.revokeComplimentary.mockResolvedValue(revokedSubscription);
    userRepository.updatePlan.mockResolvedValue({ ...user, plan: "FREE" });

    await usecase.execute({ userId });

    expect(billingSubscriptionRepository.revokeComplimentary).toHaveBeenCalledWith(userId);
    expect(userRepository.updatePlan).toHaveBeenCalledWith(userId, "FREE");
  });

  it("throws 404 when the target user does not exist", async () => {
    const { usecase, userRepository, billingSubscriptionRepository } = setup();
    userRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute({ userId })).rejects.toThrow(
      "指定されたユーザーが見つかりません。",
    );
    expect(billingSubscriptionRepository.revokeComplimentary).not.toHaveBeenCalled();
  });

  it("throws 404 when there is no active complimentary grant to revoke", async () => {
    const { usecase, userRepository, billingSubscriptionRepository } = setup();
    userRepository.findById.mockResolvedValue(user);
    billingSubscriptionRepository.revokeComplimentary.mockResolvedValue(null);

    await expect(usecase.execute({ userId })).rejects.toThrow(
      "有効なcomplimentary付与が見つかりません。",
    );
    expect(userRepository.updatePlan).not.toHaveBeenCalled();
  });
});
