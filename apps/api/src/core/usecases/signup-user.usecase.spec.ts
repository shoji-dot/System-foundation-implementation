import { ConflictException } from "@nestjs/common";

import type { PasswordHasher } from "../domain/password-hasher";
import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { SignupUserUsecase } from "./signup-user.usecase";

describe("SignupUserUsecase", () => {
  const existingUser: User = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    email: "exists@example.com",
    passwordHash: "hashed",
    name: "Existing User",
    locale: "ja",
    systemRole: "USER",
    plan: "FREE",
    profession: null,
    interestedJurisdictions: [],
    onboardingCompletedAt: null,
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
    const passwordHasher: jest.Mocked<PasswordHasher> = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    const usecase = new SignupUserUsecase(userRepository, passwordHasher);
    return { usecase, userRepository, passwordHasher };
  }

  it("creates a new user with a hashed password and normalized email", async () => {
    const { usecase, userRepository, passwordHasher } = setup();
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue("hashed-password");
    userRepository.create.mockResolvedValue({
      ...existingUser,
      id: "new-id",
      email: "new@example.com",
      name: "New User",
    });

    const result = await usecase.execute({
      email: "New@Example.com",
      password: "password123",
      name: "New User",
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith("new@example.com");
    expect(passwordHasher.hash).toHaveBeenCalledWith("password123");
    expect(userRepository.create).toHaveBeenCalledWith({
      email: "new@example.com",
      passwordHash: "hashed-password",
      name: "New User",
    });
    expect(result.email).toBe("new@example.com");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("rejects signup when the email is already registered", async () => {
    const { usecase, userRepository, passwordHasher } = setup();
    userRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(
      usecase.execute({
        email: "exists@example.com",
        password: "password123",
        name: "Someone",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
