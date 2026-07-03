import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";

import type { TokenService } from "../../core/domain/token-service";

import type { AuthenticatedRequest } from "./authenticated-request";
import { JwtAuthGuard } from "./jwt-auth.guard";

function createContext(authorizationHeader?: string): ExecutionContext {
  const request = {
    headers: { authorization: authorizationHeader },
  } as unknown as AuthenticatedRequest;

  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  function setup() {
    const tokenService: jest.Mocked<TokenService> = {
      issueTokenPair: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    const guard = new JwtAuthGuard(tokenService);
    return { guard, tokenService };
  }

  it("attaches the verified payload to the request and allows access", async () => {
    const { guard, tokenService } = setup();
    tokenService.verifyAccessToken.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      systemRole: "USER",
      plan: "FREE",
    });
    const context = createContext("Bearer valid-token");

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith("valid-token");
  });

  it("rejects when the Authorization header is missing", async () => {
    const { guard } = setup();
    const context = createContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects when the Authorization header has no Bearer prefix", async () => {
    const { guard } = setup();
    const context = createContext("Basic abc123");

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects when token verification fails", async () => {
    const { guard, tokenService } = setup();
    tokenService.verifyAccessToken.mockRejectedValue(new Error("invalid"));
    const context = createContext("Bearer bad-token");

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
