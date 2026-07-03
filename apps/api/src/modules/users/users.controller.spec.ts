import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetCurrentUserUsecase } from "../../core/usecases/get-current-user.usecase";

import { UsersController } from "./users.controller";

describe("UsersController", () => {
  let controller: UsersController;
  const execute = jest.fn();

  beforeEach(async () => {
    execute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: GetCurrentUserUsecase, useValue: { execute } }],
    })
      // JwtAuthGuardはTOKEN_SERVICEに依存するため、コントローラ単体テストではガード自体の
      // 振る舞い(jwt-auth.guard.spec.tsで別途検証済み)を検証せず、常に通過させる。
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
  });

  it("returns the profile of the authenticated user", async () => {
    execute.mockResolvedValue({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
      email: "user@example.com",
      name: "User",
      locale: "ja",
      systemRole: "USER",
      plan: "FREE",
      createdAt: new Date("2026-07-03T00:00:00.000Z"),
    });

    const request = {
      user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f", email: "user@example.com" },
    } as unknown as AuthenticatedRequest;

    const result = await controller.me(request);

    expect(execute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f");
    expect(result).not.toHaveProperty("passwordHash");
  });
});
