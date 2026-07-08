import { UnauthorizedException } from "@nestjs/common";

import type { TokenRevocationStore } from "../domain/token-revocation-store";
import { InvalidTokenError } from "../domain/token-service";
import type { TokenService } from "../domain/token-service";
import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { RefreshTokenUsecase } from "./refresh-token.usecase";

describe("RefreshTokenUsecase", () => {
  const user: User = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    email: "user@example.com",
    passwordHash: "hashed",
    name: "User",
    locale: "ja",
    systemRole: "USER",
    plan: "FREE",
    profession: null,
    interestedJurisdictions: [],
    onboardingCompletedAt: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };

  const validPayload = {
    userId: user.id,
    jti: "jti-1",
    expiresAt: new Date(Date.now() + 60_000),
  };

  function setup() {
    const tokenService: jest.Mocked<TokenService> = {
      issueTokenPair: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    const revocationStore: jest.Mocked<TokenRevocationStore> = {
      revoke: jest.fn(),
      isRevoked: jest.fn(),
    };
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
    const usecase = new RefreshTokenUsecase(tokenService, revocationStore, userRepository);
    return { usecase, tokenService, revocationStore, userRepository };
  }

  it("rotates the refresh token and issues a new pair", async () => {
    const { usecase, tokenService, revocationStore, userRepository } = setup();
    tokenService.verifyRefreshToken.mockResolvedValue(validPayload);
    revocationStore.isRevoked.mockResolvedValue(false);
    userRepository.findById.mockResolvedValue(user);
    tokenService.issueTokenPair.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      accessTokenExpiresIn: 900,
    });

    const result = await usecase.execute("some-refresh-token");

    expect(revocationStore.revoke).toHaveBeenCalledWith(validPayload.jti, expect.any(Number));
    expect(tokenService.issueTokenPair).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      plan: user.plan,
    });
    expect(result.accessToken).toBe("new-access");
  });

  it("rejects when the token signature/expiry is invalid", async () => {
    const { usecase, tokenService, revocationStore } = setup();
    tokenService.verifyRefreshToken.mockRejectedValue(new InvalidTokenError("bad"));

    await expect(usecase.execute("bad-token")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(revocationStore.revoke).not.toHaveBeenCalled();
  });

  it("rejects when the token has already been revoked (reuse detection)", async () => {
    const { usecase, tokenService, revocationStore, userRepository } = setup();
    tokenService.verifyRefreshToken.mockResolvedValue(validPayload);
    revocationStore.isRevoked.mockResolvedValue(true);

    await expect(usecase.execute("reused-token")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it("rejects when the user no longer exists", async () => {
    const { usecase, tokenService, revocationStore, userRepository } = setup();
    tokenService.verifyRefreshToken.mockResolvedValue(validPayload);
    revocationStore.isRevoked.mockResolvedValue(false);
    userRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute("orphaned-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
