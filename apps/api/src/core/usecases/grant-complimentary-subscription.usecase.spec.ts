import type { BillingSubscription } from "../domain/billing-subscription.entity";
import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { GrantComplimentarySubscriptionUsecase } from "./grant-complimentary-subscription.usecase";

describe("GrantComplimentarySubscriptionUsecase", () => {
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a";
  const organizationId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";

  const user: User = {
    id: userId,
    email: "user@example.com",
    passwordHash: "hashed",
    name: "User",
    locale: "ja",
    systemRole: "USER",
    plan: "FREE",
    profession: null,
    interestedJurisdictions: [],
    onboardingCompletedAt: null,
    createdAt: new Date("2026-07-09T00:00:00.000Z"),
    updatedAt: new Date("2026-07-09T00:00:00.000Z"),
  };

  const savedSubscription: BillingSubscription = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    userId,
    organizationId,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    plan: "ENTERPRISE",
    status: "ACTIVE",
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
    const usecase = new GrantComplimentarySubscriptionUsecase(
      userRepository,
      billingSubscriptionRepository,
    );
    return { usecase, userRepository, billingSubscriptionRepository };
  }

  it("grants a complimentary subscription and syncs users.plan", async () => {
    const { usecase, userRepository, billingSubscriptionRepository } = setup();
    userRepository.findById.mockResolvedValue(user);
    billingSubscriptionRepository.upsertComplimentary.mockResolvedValue(savedSubscription);
    userRepository.updatePlan.mockResolvedValue({ ...user, plan: "ENTERPRISE" });

    const result = await usecase.execute({ userId, organizationId, plan: "ENTERPRISE" });

    expect(billingSubscriptionRepository.upsertComplimentary).toHaveBeenCalledWith({
      userId,
      organizationId,
      plan: "ENTERPRISE",
    });
    expect(userRepository.updatePlan).toHaveBeenCalledWith(userId, "ENTERPRISE");
    expect(result).toEqual(savedSubscription);
  });

  it("defaults organizationId to null when not provided", async () => {
    const { usecase, userRepository, billingSubscriptionRepository } = setup();
    userRepository.findById.mockResolvedValue(user);
    billingSubscriptionRepository.upsertComplimentary.mockResolvedValue({
      ...savedSubscription,
      organizationId: null,
    });

    await usecase.execute({ userId, plan: "PRO" });

    expect(billingSubscriptionRepository.upsertComplimentary).toHaveBeenCalledWith({
      userId,
      organizationId: null,
      plan: "PRO",
    });
  });

  it("rejects granting FREE as complimentary", async () => {
    const { usecase, userRepository, billingSubscriptionRepository } = setup();

    await expect(usecase.execute({ userId, plan: "FREE" })).rejects.toMatchObject({
      status: 400,
    });
    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(billingSubscriptionRepository.upsertComplimentary).not.toHaveBeenCalled();
  });

  it("throws 404 when the target user does not exist", async () => {
    const { usecase, userRepository } = setup();
    userRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute({ userId, plan: "PRO" })).rejects.toThrow(
      "指定されたユーザーが見つかりません。",
    );
  });
});
