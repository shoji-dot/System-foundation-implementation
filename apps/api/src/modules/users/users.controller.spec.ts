import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CompleteOnboardingUsecase } from "../../core/usecases/complete-onboarding.usecase";
import { GetCurrentUserUsecase } from "../../core/usecases/get-current-user.usecase";
import { ListMyOrganizationsUsecase } from "../../core/usecases/list-my-organizations.usecase";
import { UpdateProfileUsecase } from "../../core/usecases/update-profile.usecase";

import { UsersController } from "./users.controller";

describe("UsersController", () => {
  let controller: UsersController;
  const execute = jest.fn();
  const completeOnboardingExecute = jest.fn();
  const updateProfileExecute = jest.fn();
  const listMyOrganizationsExecute = jest.fn();

  beforeEach(async () => {
    execute.mockReset();
    completeOnboardingExecute.mockReset();
    updateProfileExecute.mockReset();
    listMyOrganizationsExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: GetCurrentUserUsecase, useValue: { execute } },
        { provide: CompleteOnboardingUsecase, useValue: { execute: completeOnboardingExecute } },
        { provide: UpdateProfileUsecase, useValue: { execute: updateProfileExecute } },
        { provide: ListMyOrganizationsUsecase, useValue: { execute: listMyOrganizationsExecute } },
      ],
    })
      // JwtAuthGuardはTOKEN_SERVICEに依存するため、コントローラ単体テストではガード自体の
      // 振る舞い(jwt-auth.guard.spec.tsで別途検証済み)を検証せず、常に通過させる。
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
  });

  const request = {
    user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f", email: "user@example.com" },
  } as unknown as AuthenticatedRequest;

  it("returns the profile of the authenticated user", async () => {
    execute.mockResolvedValue({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
      email: "user@example.com",
      name: "User",
      locale: "ja",
      systemRole: "USER",
      plan: "FREE",
      profession: null,
      interestedJurisdictions: [],
      onboardingCompletedAt: null,
      createdAt: new Date("2026-07-03T00:00:00.000Z"),
    });

    const result = await controller.me(request);

    expect(execute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("completes onboarding for the authenticated user", async () => {
    completeOnboardingExecute.mockResolvedValue({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
      email: "user@example.com",
      name: "User",
      locale: "ja",
      systemRole: "USER",
      plan: "FREE",
      profession: "REGULATORY",
      interestedJurisdictions: ["JP"],
      onboardingCompletedAt: new Date("2026-07-07T00:00:00.000Z"),
      createdAt: new Date("2026-07-03T00:00:00.000Z"),
    });

    const result = await controller.completeOnboarding(request, {
      profession: "REGULATORY",
      interestedJurisdictions: ["JP"],
    });

    expect(completeOnboardingExecute).toHaveBeenCalledWith({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
      profession: "REGULATORY",
      interestedJurisdictions: ["JP"],
    });
    expect(result.onboardingCompletedAt).not.toBeNull();
  });

  it("updates the profile of the authenticated user", async () => {
    updateProfileExecute.mockResolvedValue({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
      email: "user@example.com",
      name: "New Name",
      locale: "en",
      systemRole: "USER",
      plan: "FREE",
      profession: "QA",
      interestedJurisdictions: ["JP", "US"],
      onboardingCompletedAt: new Date("2026-07-07T00:00:00.000Z"),
      createdAt: new Date("2026-07-03T00:00:00.000Z"),
    });

    const result = await controller.updateProfile(request, {
      name: "New Name",
      locale: "en",
      profession: "QA",
      interestedJurisdictions: ["JP", "US"],
    });

    expect(updateProfileExecute).toHaveBeenCalledWith({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
      name: "New Name",
      locale: "en",
      profession: "QA",
      interestedJurisdictions: ["JP", "US"],
    });
    expect(result.name).toBe("New Name");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns the organizations the authenticated user belongs to", async () => {
    listMyOrganizationsExecute.mockResolvedValue([
      {
        organizationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
        organizationName: "Acme Medical",
        organizationType: "MAKER",
        role: "ORG_ADMIN",
      },
    ]);

    const result = await controller.myOrganizations(request);

    expect(listMyOrganizationsExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.organizationName).toBe("Acme Medical");
  });
});
