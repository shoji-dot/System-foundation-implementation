import { UnauthorizedException } from "@nestjs/common";

import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { GetCurrentUserUsecase } from "./get-current-user.usecase";

describe("GetCurrentUserUsecase", () => {
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
    };
    const usecase = new GetCurrentUserUsecase(userRepository);
    return { usecase, userRepository };
  }

  it("returns the public user profile without the password hash", async () => {
    const { usecase, userRepository } = setup();
    userRepository.findById.mockResolvedValue(user);

    const result = await usecase.execute(user.id);

    expect(result).not.toHaveProperty("passwordHash");
    expect(result.email).toBe(user.email);
  });

  it("rejects when the user no longer exists", async () => {
    const { usecase, userRepository } = setup();
    userRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute("missing-id")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
