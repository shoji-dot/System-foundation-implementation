import { NotFoundException } from "@nestjs/common";

import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { UpdateProfileUsecase } from "./update-profile.usecase";

describe("UpdateProfileUsecase", () => {
  const user: User = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    email: "user@example.com",
    passwordHash: "hashed",
    name: "User",
    locale: "ja",
    systemRole: "USER",
    plan: "FREE",
    profession: "REGULATORY",
    interestedJurisdictions: ["JP"],
    onboardingCompletedAt: new Date("2026-07-01T00:00:00.000Z"),
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
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
    const usecase = new UpdateProfileUsecase(userRepository);
    return { usecase, userRepository };
  }

  it("updates the profile fields and returns the public user", async () => {
    const { usecase, userRepository } = setup();
    userRepository.findById.mockResolvedValue(user);
    userRepository.updateProfile.mockResolvedValue({
      ...user,
      name: "New Name",
      locale: "en",
      profession: "QA",
      interestedJurisdictions: ["JP", "US"],
    });

    const result = await usecase.execute({
      id: user.id,
      name: "New Name",
      locale: "en",
      profession: "QA",
      interestedJurisdictions: ["JP", "US"],
    });

    expect(userRepository.updateProfile).toHaveBeenCalledWith(user.id, {
      name: "New Name",
      locale: "en",
      profession: "QA",
      interestedJurisdictions: ["JP", "US"],
    });
    expect(result.name).toBe("New Name");
    expect(result.locale).toBe("en");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("rejects when the user does not exist", async () => {
    const { usecase, userRepository } = setup();
    userRepository.findById.mockResolvedValue(null);

    await expect(
      usecase.execute({
        id: "missing",
        name: "Name",
        locale: "ja",
        profession: "QA",
        interestedJurisdictions: ["JP"],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(userRepository.updateProfile).not.toHaveBeenCalled();
  });
});
