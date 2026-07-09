import { isPurchasablePlan, resolveStripePriceId } from "./billing-plan";

describe("billing-plan", () => {
  describe("isPurchasablePlan", () => {
    it("returns true for PRO/BUSINESS, false for FREE/ENTERPRISE", () => {
      expect(isPurchasablePlan("PRO")).toBe(true);
      expect(isPurchasablePlan("BUSINESS")).toBe(true);
      expect(isPurchasablePlan("FREE")).toBe(false);
      expect(isPurchasablePlan("ENTERPRISE")).toBe(false);
    });
  });

  describe("resolveStripePriceId", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("resolves the price id from the matching environment variable", () => {
      process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_month";
      process.env.STRIPE_PRICE_BUSINESS_YEARLY = "price_business_year";

      expect(resolveStripePriceId("PRO", "month")).toBe("price_pro_month");
      expect(resolveStripePriceId("BUSINESS", "year")).toBe("price_business_year");
    });

    it("throws when the environment variable is not set", () => {
      delete process.env.STRIPE_PRICE_PRO_MONTHLY;

      expect(() => resolveStripePriceId("PRO", "month")).toThrow(
        "STRIPE_PRICE_PRO_MONTHLY が設定されていません。",
      );
    });
  });
});
