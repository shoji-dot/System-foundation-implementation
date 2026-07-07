import { NotFoundException } from "@nestjs/common";

import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { UpdateUserPlanUsecase } from "./update-user-plan.usecase";

describe("UpdateUserPlanUsecase", () => {
  const user: User = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    email: "user@example.com",
    passwordHash: "hashed",
    name: "User",
    locale: "ja",
    systemRole: "USER",
    plan: "FREE",
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
    };
    const usecase = new UpdateUserPlanUsecase(userRepository);
    return { usecase, userRepository };
  }

  it("updates the user's plan", async () => {
    const { usecase, userRepository } = setup();
    userRepository.findById.mockResolvedValue(user);
    userRepository.updatePlan.mockResolvedValue({ ...user, plan: "PRO" });

    const result = await usecase.execute({ id: user.id, plan: "PRO" });

    expect(userRepository.updatePlan).toHaveBeenCalledWith(user.id, "PRO");
    expect(result.plan).toBe("PRO");
  });

  it("rejects when the user does not exist", async () => {
    const { usecase, userRepository } = setup();
    userRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute({ id: "missing", plan: "ENTERPRISE" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(userRepository.updatePlan).not.toHaveBeenCalled();
  });
});
