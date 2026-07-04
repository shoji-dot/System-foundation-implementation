import type { TokenRevocationStore } from "../domain/token-revocation-store";
import { InvalidTokenError } from "../domain/token-service";
import type { TokenService } from "../domain/token-service";

import { LogoutUserUsecase } from "./logout-user.usecase";

describe("LogoutUserUsecase", () => {
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
    const usecase = new LogoutUserUsecase(tokenService, revocationStore);
    return { usecase, tokenService, revocationStore };
  }

  it("revokes the refresh token jti", async () => {
    const { usecase, tokenService, revocationStore } = setup();
    tokenService.verifyRefreshToken.mockResolvedValue({
      userId: "u1",
      jti: "jti-1",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await usecase.execute("valid-refresh-token");

    expect(revocationStore.revoke).toHaveBeenCalledWith("jti-1", expect.any(Number));
  });

  it("succeeds idempotently when the token is already invalid", async () => {
    const { usecase, tokenService, revocationStore } = setup();
    tokenService.verifyRefreshToken.mockRejectedValue(new InvalidTokenError("expired"));

    await expect(usecase.execute("already-invalid-token")).resolves.toBeUndefined();
    expect(revocationStore.revoke).not.toHaveBeenCalled();
  });
});
