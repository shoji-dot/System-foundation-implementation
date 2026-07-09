import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import type { OrganizationMembership } from "../domain/membership.entity";
import type { MembershipRepository } from "../domain/membership.repository";
import type { StripeClient, StripePortalSession } from "../domain/stripe-client";

import { CreatePortalSessionUsecase } from "./create-portal-session.usecase";

describe("CreatePortalSessionUsecase", () => {
  const originalEnv = { ...process.env };
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a";
  const organizationId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";
  const portalSession: StripePortalSession = { url: "https://billing.stripe.com/session/test" };

  function setup() {
    const stripeClient: jest.Mocked<StripeClient> = {
      createCheckoutSession: jest.fn(),
      createPortalSession: jest.fn(),
      constructEvent: jest.fn(),
    };
    const billingSubscriptionRepository: jest.Mocked<BillingSubscriptionRepository> = {
      upsertFromStripe: jest.fn(),
      findStripeCustomerId: jest.fn(),
      upsertComplimentary: jest.fn(),
      revokeComplimentary: jest.fn(),
    };
    const membershipRepository: jest.Mocked<MembershipRepository> = {
      findManyForUser: jest.fn(),
    };
    const usecase = new CreatePortalSessionUsecase(
      stripeClient,
      billingSubscriptionRepository,
      membershipRepository,
    );
    return { usecase, stripeClient, billingSubscriptionRepository, membershipRepository };
  }

  beforeEach(() => {
    process.env.WEB_APP_URL = "https://app.example.com";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("creates a portal session for the individual's Stripe customer", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository, membershipRepository } = setup();
    billingSubscriptionRepository.findStripeCustomerId.mockResolvedValue("cus_test_1");
    stripeClient.createPortalSession.mockResolvedValue(portalSession);

    const result = await usecase.execute({ userId });

    expect(result).toEqual(portalSession);
    expect(membershipRepository.findManyForUser).not.toHaveBeenCalled();
    expect(billingSubscriptionRepository.findStripeCustomerId).toHaveBeenCalledWith({
      userId,
      organizationId: null,
    });
    expect(stripeClient.createPortalSession).toHaveBeenCalledWith({
      customerId: "cus_test_1",
      returnUrl: "https://app.example.com/account/billing",
    });
  });

  it("creates a portal session for the organization when the caller is ORG_ADMIN", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository, membershipRepository } = setup();
    const memberships: OrganizationMembership[] = [
      { organizationId, organizationName: "Acme", organizationType: "MAKER", role: "ORG_ADMIN" },
    ];
    membershipRepository.findManyForUser.mockResolvedValue(memberships);
    billingSubscriptionRepository.findStripeCustomerId.mockResolvedValue("cus_test_org");
    stripeClient.createPortalSession.mockResolvedValue(portalSession);

    const result = await usecase.execute({ userId, organizationId });

    expect(result).toEqual(portalSession);
    expect(billingSubscriptionRepository.findStripeCustomerId).toHaveBeenCalledWith({
      userId,
      organizationId,
    });
  });

  it("rejects when the caller is not an ORG_ADMIN of the given organization", async () => {
    const { usecase, membershipRepository } = setup();
    membershipRepository.findManyForUser.mockResolvedValue([
      { organizationId, organizationName: "Acme", organizationType: "MAKER", role: "MEMBER" },
    ]);

    await expect(usecase.execute({ userId, organizationId })).rejects.toThrow(
      "この組織の請求を変更する権限がありません。",
    );
  });

  it("throws 404 when no Stripe customer exists yet", async () => {
    const { usecase, billingSubscriptionRepository } = setup();
    billingSubscriptionRepository.findStripeCustomerId.mockResolvedValue(null);

    await expect(usecase.execute({ userId })).rejects.toMatchObject({ status: 404 });
  });
});
