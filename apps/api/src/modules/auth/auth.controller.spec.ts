import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";

import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  let controller: AuthController;
  const execute = jest.fn();

  beforeEach(async () => {
    execute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: SignupUserUsecase, useValue: { execute } }],
    }).compile();

    controller = module.get(AuthController);
  });

  it("returns the created user without the password hash", async () => {
    execute.mockResolvedValue({
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
