import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateCheckoutSessionUsecase } from "../../core/usecases/create-checkout-session.usecase";

import { BillingController } from "./billing.controller";

describe("BillingController", () => {
  let controller: BillingController;
  const checkoutExecute = jest.fn();

  beforeEach(async () => {
    checkoutExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: CreateCheckoutSessionUsecase, useValue: { execute: checkoutExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(BillingController);
  });

  describe("checkout", () => {
    it("passes the authenticated user's id/email to the usecase and returns the checkout url", async () => {
      checkoutExecute.mockResolvedValue({
        id: "cs_test_1",
        url: "https://checkout.stripe.com/cs_test_1",
      });

      const request = {
        user: {
          userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
          email: "user@example.com",
          plan: "FREE",
        },
      } as AuthenticatedRequest;

      const result = await controller.checkout(request, { plan: "PRO", interval: "month" });

      expect(checkoutExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        email: "user@example.com",
        plan: "PRO",
        interval: "month",
        organizationId: undefined,
      });
      expect(result).toEqual({ url: "https://checkout.stripe.com/cs_test_1" });
    });

    it("forwards organizationId for BUSINESS purchases", async () => {
      checkoutExecute.mockResolvedValue({
        id: "cs_test_2",
        url: "https://checkout.stripe.com/cs_test_2",
      });

      const request = {
        user: {
          userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
          email: "admin@example.com",
          plan: "FREE",
        },
      } as AuthenticatedRequest;

      await controller.checkout(request, {
        plan: "BUSINESS",
        interval: "year",
        organizationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      });

      expect(checkoutExecute).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b" }),
      );
    });
  });
});
