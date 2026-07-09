import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { GrantComplimentarySubscriptionUsecase } from "../../core/usecases/grant-complimentary-subscription.usecase";
import { RevokeComplimentarySubscriptionUsecase } from "../../core/usecases/revoke-complimentary-subscription.usecase";

import { AdminSubscriptionsController } from "./admin-subscriptions.controller";

describe("AdminSubscriptionsController", () => {
  let controller: AdminSubscriptionsController;
  const grantExecute = jest.fn();
  const revokeExecute = jest.fn();
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a";
  const organizationId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";

  beforeEach(async () => {
    grantExecute.mockReset();
    revokeExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSubscriptionsController],
      providers: [
        { provide: GrantComplimentarySubscriptionUsecase, useValue: { execute: grantExecute } },
        { provide: RevokeComplimentarySubscriptionUsecase, useValue: { execute: revokeExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminSubscriptionsController);
  });

  describe("grant", () => {
    it("delegates to the usecase with the param id and body, and returns a serialized subscription", async () => {
      grantExecute.mockResolvedValue({
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
      });

      const result = await controller.grant({ id: userId }, { organizationId, plan: "ENTERPRISE" });

      expect(grantExecute).toHaveBeenCalledWith({ userId, organizationId, plan: "ENTERPRISE" });
      expect(result).toEqual(
        expect.objectContaining({
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          userId,
          organizationId,
          plan: "ENTERPRISE",
          status: "ACTIVE",
          source: "COMPLIMENTARY",
          currentPeriodEnd: null,
          createdAt: "2026-07-09T00:00:00.000Z",
        }),
      );
    });
  });

  describe("revoke", () => {
    it("delegates to the usecase with the param id", async () => {
      revokeExecute.mockResolvedValue(undefined);

      await controller.revoke({ id: userId });

      expect(revokeExecute).toHaveBeenCalledWith({ userId });
    });
  });
});
