import type { OrganizationMembership } from "../domain/membership.entity";
import type { MembershipRepository } from "../domain/membership.repository";
import type { StripeCheckoutSession, StripeClient } from "../domain/stripe-client";

import { CreateCheckoutSessionUsecase } from "./create-checkout-session.usecase";

describe("CreateCheckoutSessionUsecase", () => {
  const originalEnv = { ...process.env };
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a";
  const organizationId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";
  const session: StripeCheckoutSession = {
    id: "cs_test_1",
    url: "https://checkout.stripe.com/cs_test_1",
  };

  function setup() {
    const stripeClient: jest.Mocked<StripeClient> = {
      createCheckoutSession: jest.fn(),
      constructEvent: jest.fn(),
    };
    const membershipRepository: jest.Mocked<MembershipRepository> = {
      findManyForUser: jest.fn(),
    };
    const usecase = new CreateCheckoutSessionUsecase(stripeClient, membershipRepository);
    return { usecase, stripeClient, membershipRepository };
  }

  beforeEach(() => {
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_month";
    process.env.STRIPE_PRICE_BUSINESS_MONTHLY = "price_business_month";
    process.env.WEB_APP_URL = "https://app.example.com";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("creates a checkout session for an individual PRO purchase", async () => {
    const { usecase, stripeClient, membershipRepository } = setup();
    stripeClient.createCheckoutSession.mockResolvedValue(session);

    const result = await usecase.execute({
      userId,
      email: "user@example.com",
      plan: "PRO",
      interval: "month",
    });

    expect(result).toEqual(session);
    expect(membershipRepository.findManyForUser).not.toHaveBeenCalled();
    expect(stripeClient.createCheckoutSession).toHaveBeenCalledWith({
      customerEmail: "user@example.com",
      priceId: "price_pro_month",
      successUrl: "https://app.example.com/account/billing?checkout=success",
      cancelUrl: "https://app.example.com/account/billing?checkout=canceled",
      metadata: { userId, plan: "PRO" },
    });
  });

  it("rejects PRO purchases that specify an organizationId", async () => {
    const { usecase } = setup();

    await expect(
      usecase.execute({
        userId,
        email: "user@example.com",
        plan: "PRO",
        interval: "month",
        organizationId,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("creates a checkout session for a BUSINESS purchase when the caller is ORG_ADMIN", async () => {
    const { usecase, stripeClient, membershipRepository } = setup();
    const membership: OrganizationMembership = {
      organizationId,
      organizationName: "Acme",
      organizationType: "MAKER",
      role: "ORG_ADMIN",
    };
    membershipRepository.findManyForUser.mockResolvedValue([membership]);
    stripeClient.createCheckoutSession.mockResolvedValue(session);

    const result = await usecase.execute({
      userId,
      email: "admin@example.com",
      plan: "BUSINESS",
      interval: "month",
      organizationId,
    });

    expect(result).toEqual(session);
    expect(stripeClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { userId, plan: "BUSINESS", organizationId } }),
    );
  });

  it("rejects BUSINESS purchases without an organizationId", async () => {
    const { usecase } = setup();

    await expect(
      usecase.execute({ userId, email: "user@example.com", plan: "BUSINESS", interval: "month" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects BUSINESS purchases when the caller is not ORG_ADMIN of the organization", async () => {
    const { usecase, membershipRepository } = setup();
    membershipRepository.findManyForUser.mockResolvedValue([
      { organizationId, organizationName: "Acme", organizationType: "MAKER", role: "MEMBER" },
    ]);

    await expect(
      usecase.execute({
        userId,
        email: "user@example.com",
        plan: "BUSINESS",
        interval: "month",
        organizationId,
      }),
    ).rejects.toThrow("この組織の請求を変更する権限がありません。");
  });

  it("rejects FREE/ENTERPRISE plans", async () => {
    const { usecase } = setup();

    await expect(
      usecase.execute({ userId, email: "user@example.com", plan: "FREE", interval: "month" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      usecase.execute({ userId, email: "user@example.com", plan: "ENTERPRISE", interval: "month" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
