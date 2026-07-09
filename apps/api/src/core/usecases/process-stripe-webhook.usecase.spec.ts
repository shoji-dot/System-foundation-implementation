import type { BillingSubscription } from "../domain/billing-subscription.entity";
import type { BillingSubscriptionRepository } from "../domain/billing-subscription.repository";
import type { StripeClient, StripeEvent } from "../domain/stripe-client";

import { ProcessStripeWebhookUsecase } from "./process-stripe-webhook.usecase";

describe("ProcessStripeWebhookUsecase", () => {
  const payload = Buffer.from("{}");
  const signature = "t=1,v1=abc";
  const savedSubscription: BillingSubscription = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
    organizationId: null,
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    plan: "PRO",
    status: "ACTIVE",
    source: "STRIPE",
    currentPeriodEnd: new Date("2026-08-09T00:00:00.000Z"),
    seats: 1,
    createdAt: new Date("2026-07-09T00:00:00.000Z"),
    updatedAt: new Date("2026-07-09T00:00:00.000Z"),
  };

  function setup() {
    const stripeClient: jest.Mocked<StripeClient> = {
      createCheckoutSession: jest.fn(),
      constructEvent: jest.fn(),
    };
    const billingSubscriptionRepository: jest.Mocked<BillingSubscriptionRepository> = {
      upsertFromStripe: jest.fn(),
    };
    const usecase = new ProcessStripeWebhookUsecase(stripeClient, billingSubscriptionRepository);
    return { usecase, stripeClient, billingSubscriptionRepository };
  }

  function subscriptionEvent(overrides: {
    type?: string;
    status?: string;
    metadata?: Record<string, string>;
    itemsData?: unknown[];
  }): StripeEvent {
    return {
      id: "evt_1",
      type: overrides.type ?? "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: overrides.status ?? "active",
          metadata: overrides.metadata ?? { userId: savedSubscription.userId, plan: "PRO" },
          items: {
            data: overrides.itemsData ?? [{ quantity: 1, current_period_end: 1754697600 }],
          },
        },
      },
    };
  }

  it("upserts the subscription for customer.subscription.updated with valid metadata", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository } = setup();
    stripeClient.constructEvent.mockReturnValue(subscriptionEvent({}));
    billingSubscriptionRepository.upsertFromStripe.mockResolvedValue(savedSubscription);

    await usecase.execute(payload, signature);

    expect(stripeClient.constructEvent).toHaveBeenCalledWith(payload, signature);
    expect(billingSubscriptionRepository.upsertFromStripe).toHaveBeenCalledWith({
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: "cus_1",
      userId: savedSubscription.userId,
      organizationId: null,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodEnd: new Date(1754697600 * 1000),
      seats: 1,
    });
  });

  it("passes organizationId through when present in metadata", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository } = setup();
    stripeClient.constructEvent.mockReturnValue(
      subscriptionEvent({
        metadata: { userId: savedSubscription.userId, plan: "BUSINESS", organizationId: "org-1" },
      }),
    );
    billingSubscriptionRepository.upsertFromStripe.mockResolvedValue(savedSubscription);

    await usecase.execute(payload, signature);

    expect(billingSubscriptionRepository.upsertFromStripe).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "BUSINESS", organizationId: "org-1" }),
    );
  });

  it("marks the subscription CANCELED for customer.subscription.deleted", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository } = setup();
    stripeClient.constructEvent.mockReturnValue(
      subscriptionEvent({ type: "customer.subscription.deleted", status: "canceled" }),
    );
    billingSubscriptionRepository.upsertFromStripe.mockResolvedValue(savedSubscription);

    await usecase.execute(payload, signature);

    expect(billingSubscriptionRepository.upsertFromStripe).toHaveBeenCalledWith(
      expect.objectContaining({ status: "CANCELED" }),
    );
  });

  it("ignores unrelated event types without touching the repository", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository } = setup();
    stripeClient.constructEvent.mockReturnValue({
      id: "evt_2",
      type: "invoice.paid",
      data: { object: {} },
    });

    await usecase.execute(payload, signature);

    expect(billingSubscriptionRepository.upsertFromStripe).not.toHaveBeenCalled();
  });

  it("skips syncing when metadata has no userId/plan (e.g. manually created in Stripe dashboard)", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository } = setup();
    stripeClient.constructEvent.mockReturnValue(subscriptionEvent({ metadata: {} }));

    await usecase.execute(payload, signature);

    expect(billingSubscriptionRepository.upsertFromStripe).not.toHaveBeenCalled();
  });

  it("skips syncing when the subscription has no items (defensive, should not happen in practice)", async () => {
    const { usecase, stripeClient, billingSubscriptionRepository } = setup();
    stripeClient.constructEvent.mockReturnValue(subscriptionEvent({ itemsData: [] }));
    billingSubscriptionRepository.upsertFromStripe.mockResolvedValue(savedSubscription);

    await usecase.execute(payload, signature);

    expect(billingSubscriptionRepository.upsertFromStripe).toHaveBeenCalledWith(
      expect.objectContaining({ currentPeriodEnd: null, seats: 1 }),
    );
  });

  it("propagates signature verification errors from the StripeClient", async () => {
    const { usecase, stripeClient } = setup();
    stripeClient.constructEvent.mockImplementation(() => {
      throw new Error("Stripe Webhookの署名検証に失敗しました。");
    });

    await expect(usecase.execute(payload, signature)).rejects.toThrow(
      "Stripe Webhookの署名検証に失敗しました。",
    );
  });
});
