import { StripeRestClient } from "./stripe-client";

describe("StripeRestClient", () => {
  const originalSecretKey = process.env.STRIPE_SECRET_KEY;
  let client: StripeRestClient;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    client = new StripeRestClient();
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalSecretKey;
    jest.restoreAllMocks();
  });

  it("posts to /checkout/sessions and returns the session id/url", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ id: "cs_test_123", url: "https://checkout.stripe.com/cs_test_123" }),
    } as Response);

    const result = await client.createCheckoutSession({
      customerEmail: "user@example.com",
      priceId: "price_123",
      successUrl: "https://app.example.com/account/billing?checkout=success",
      cancelUrl: "https://app.example.com/account/billing?checkout=canceled",
      metadata: { userId: "user-1", plan: "PRO" },
    });

    expect(result).toEqual({ id: "cs_test_123", url: "https://checkout.stripe.com/cs_test_123" });

    const call = fetchSpy.mock.calls[0];
    if (!call) {
      throw new Error("fetch was not called");
    }
    const [url, init] = call;
    expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer sk_test_dummy",
    });
    const body = (init as RequestInit).body as string;
    expect(body).toContain("customer_email=user%40example.com");
    expect(body).toContain("line_items%5B0%5D%5Bprice%5D=price_123");
    expect(body).toContain("metadata%5BuserId%5D=user-1");
    expect(body).toContain("subscription_data%5Bmetadata%5D%5BuserId%5D=user-1");
  });

  it("throws when STRIPE_SECRET_KEY is not set", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    await expect(
      client.createCheckoutSession({
        customerEmail: "user@example.com",
        priceId: "price_123",
        successUrl: "https://app.example.com/success",
        cancelUrl: "https://app.example.com/cancel",
        metadata: {},
      }),
    ).rejects.toThrow("STRIPE_SECRET_KEY が設定されていません。");
  });

  it("throws with the response body when Stripe returns an error", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('{"error":{"message":"No such price"}}'),
    } as Response);

    await expect(
      client.createCheckoutSession({
        customerEmail: "user@example.com",
        priceId: "price_invalid",
        successUrl: "https://app.example.com/success",
        cancelUrl: "https://app.example.com/cancel",
        metadata: {},
      }),
    ).rejects.toThrow("Stripe Checkout Session作成に失敗しました: 400");
  });
});
