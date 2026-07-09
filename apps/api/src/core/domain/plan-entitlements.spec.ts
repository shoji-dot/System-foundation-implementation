import { hasReachedProjectLimit, hasReachedSubscriptionLimit } from "./plan-entitlements";

describe("hasReachedProjectLimit", () => {
  it("returns false while the FREE plan count is below the limit (3)", () => {
    expect(hasReachedProjectLimit("FREE", 0)).toBe(false);
    expect(hasReachedProjectLimit("FREE", 2)).toBe(false);
  });

  it("returns true once the FREE plan count reaches the limit (3)", () => {
    expect(hasReachedProjectLimit("FREE", 3)).toBe(true);
    expect(hasReachedProjectLimit("FREE", 4)).toBe(true);
  });

  it("returns true once the PRO plan count reaches the limit (20)", () => {
    expect(hasReachedProjectLimit("PRO", 19)).toBe(false);
    expect(hasReachedProjectLimit("PRO", 20)).toBe(true);
  });

  it("returns true once the BUSINESS plan count reaches the limit (20, same as PRO)", () => {
    expect(hasReachedProjectLimit("BUSINESS", 19)).toBe(false);
    expect(hasReachedProjectLimit("BUSINESS", 20)).toBe(true);
  });

  it("always returns false for the unlimited ENTERPRISE plan", () => {
    expect(hasReachedProjectLimit("ENTERPRISE", 0)).toBe(false);
    expect(hasReachedProjectLimit("ENTERPRISE", 10_000)).toBe(false);
  });
});

describe("hasReachedSubscriptionLimit", () => {
  it("returns false while the FREE plan count is below the limit (3)", () => {
    expect(hasReachedSubscriptionLimit("FREE", 0)).toBe(false);
    expect(hasReachedSubscriptionLimit("FREE", 2)).toBe(false);
  });

  it("returns true once the FREE plan count reaches the limit (3)", () => {
    expect(hasReachedSubscriptionLimit("FREE", 3)).toBe(true);
    expect(hasReachedSubscriptionLimit("FREE", 4)).toBe(true);
  });

  it("returns true once the PRO plan count reaches the limit (20)", () => {
    expect(hasReachedSubscriptionLimit("PRO", 19)).toBe(false);
    expect(hasReachedSubscriptionLimit("PRO", 20)).toBe(true);
  });

  it("returns true once the BUSINESS plan count reaches the limit (20, same as PRO)", () => {
    expect(hasReachedSubscriptionLimit("BUSINESS", 19)).toBe(false);
    expect(hasReachedSubscriptionLimit("BUSINESS", 20)).toBe(true);
  });

  it("always returns false for the unlimited ENTERPRISE plan", () => {
    expect(hasReachedSubscriptionLimit("ENTERPRISE", 0)).toBe(false);
    expect(hasReachedSubscriptionLimit("ENTERPRISE", 10_000)).toBe(false);
  });
});
