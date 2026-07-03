import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { LoginUserUsecase } from "../../core/usecases/login-user.usecase";
import { LogoutUserUsecase } from "../../core/usecases/logout-user.usecase";
import { RefreshTokenUsecase } from "../../core/usecases/refresh-token.usecase";
import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";

import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  let controller: AuthController;
  const signupExecute = jest.fn();
  const loginExecute = jest.fn();
  const refreshExecute = jest.fn();
  const logoutExecute = jest.fn();

  beforeEach(async () => {
    signupExecute.mockReset();
    loginExecute.mockReset();
    refreshExecute.mockReset();
    logoutExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: SignupUserUsecase, useValue: { execute: signupExecute } },
        { provide: LoginUserUsecase, useValue: { execute: loginExecute } },
        { provide: RefreshTokenUsecase, useValue: { execute: refreshExecute } },
        { provide: LogoutUserUsecase, useValue: { execute: logoutExecute } },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe("signup", () => {
    it("returns the created user without the password hash", async () => {
      signupExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
        email: "new@example.com",
        name: "New User",
        locale: "ja",
        systemRole: "USER",
        plan: "FREE",
        createdAt: new Date("2026-07-03T00:00:00.000Z"),
      });

      const result = await controller.signup({
        email: "new@example.com",
        password: "password123",
        name: "New User",
      });

      expect(result).not.toHaveProperty("passwordHash");
      expect(result.email).toBe("new@example.com");
      expect(result.createdAt).toBe("2026-07-03T00:00:00.000Z");
    });
  });

  describe("login", () => {
    it("returns a Bearer token pair", async () => {
      loginExecute.mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresIn: 900,
      });

      const result = await controller.login({
        email: "user@example.com",
        password: "correct-password",
      });

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        tokenType: "Bearer",
        expiresIn: 900,
      });
    });
  });

  describe("refresh", () => {
    it("delegates to RefreshTokenUsecase and returns a new token pair", async () => {
      refreshExecute.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        accessTokenExpiresIn: 900,
      });

      const result = await controller.refresh({ refreshToken: "old-refresh-token" });

      expect(refreshExecute).toHaveBeenCalledWith("old-refresh-token");
      expect(result.accessToken).toBe("new-access-token");
    });
  });

  describe("logout", () => {
    it("delegates to LogoutUserUsecase", async () => {
      logoutExecute.mockResolvedValue(undefined);

      await controller.logout({ refreshToken: "some-refresh-token" });

      expect(logoutExecute).toHaveBeenCalledWith("some-refresh-token");
    });
  });
});
