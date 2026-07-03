import { UnauthorizedException } from "@nestjs/common";

import type { PasswordHasher } from "../domain/password-hasher";
import type { TokenService } from "../domain/token-service";
import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { LoginUserUsecase } from "./login-user.usecase";

describe("LoginUserUsecase", () => {
  const baseUser: User = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    email: "user@example.com",
    passwordHash: "hashed-password",
    name: "Existing User",
    locale: "ja",
    systemRole: "USER",
    plan: "FREE",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };

  function setup() {
    const userRepository: jest.Mocked<UserRepository> = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    const passwordHasher: jest.Mocked<PasswordHasher> = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    const tokenService: jest.Mocked<TokenService> = {
      issueTokenPair: jest.fn(),
    };
    const usecase = new LoginUserUsecase(userRepository, passwordHasher, tokenService);
    return { usecase, userRepository, passwordHasher, tokenService };
  }

  it("issues a token pair when credentials are valid", async () => {
    const { usecase, userRepository, passwordHasher, tokenService } = setup();
    userRepository.findByEmail.mockResolvedValue(baseUser);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.issueTokenPair.mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      accessTokenExpiresIn: 900,
    });

    const result = await usecase.execute({ email: "User@Example.com", password: "correct" });

    expect(userRepository.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(passwordHasher.compare).toHaveBeenCalledWith("correct", "hashed-password");
    expect(tokenService.issueTokenPair).toHaveBeenCalledWith({
      userId: baseUser.id,
      email: baseUser.email,
      systemRole: baseUser.systemRole,
      plan: baseUser.plan,
    });
    expect(result.accessToken).toBe("access");
  });

  it("rejects when the user does not exist", async () => {
    const { usecase, userRepository, passwordHasher, tokenService } = setup();
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue("dummy");

    await expect(usecase.execute({ email: "missing@example.com", password: "x" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });

  it("rejects when the account has no password (OAuth-only)", async () => {
    const { usecase, userRepository, passwordHasher, tokenService } = setup();
    userRepository.findByEmail.mockResolvedValue({ ...baseUser, passwordHash: null });
    passwordHasher.hash.mockResolvedValue("dummy");

    await expect(usecase.execute({ email: baseUser.email, password: "x" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });

  it("rejects when the password does not match", async () => {
    const { usecase, userRepository, passwordHasher, tokenService } = setup();
    userRepository.findByEmail.mockResolvedValue(baseUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(usecase.execute({ email: baseUser.email, password: "wrong" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });
});
