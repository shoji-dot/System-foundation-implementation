import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ListUsersUsecase } from "../../core/usecases/list-users.usecase";
import { UpdateUserPlanUsecase } from "../../core/usecases/update-user-plan.usecase";
import { UpdateUserRoleUsecase } from "../../core/usecases/update-user-role.usecase";

import { AdminUsersController } from "./admin-users.controller";

describe("AdminUsersController", () => {
  let controller: AdminUsersController;
  const listExecute = jest.fn();
  const updateRoleExecute = jest.fn();
  const updatePlanExecute = jest.fn();
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a";

  beforeEach(async () => {
    listExecute.mockReset();
    updateRoleExecute.mockReset();
    updatePlanExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        { provide: ListUsersUsecase, useValue: { execute: listExecute } },
        { provide: UpdateUserRoleUsecase, useValue: { execute: updateRoleExecute } },
        { provide: UpdateUserPlanUsecase, useValue: { execute: updatePlanExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminUsersController);
  });

  describe("list", () => {
    it("delegates to the usecase and returns serialized users", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: userId,
            email: "user@example.com",
            passwordHash: "hashed",
            name: "User",
            locale: "ja",
            systemRole: "USER",
            plan: "FREE",
            createdAt: new Date("2026-07-07T00:00:00.000Z"),
            updatedAt: new Date("2026-07-07T00:00:00.000Z"),
          },
        ],
        nextCursor: null,
      });

      const result = await controller.list({ cursor: undefined, limit: 20 });

      expect(listExecute).toHaveBeenCalledWith({ cursor: undefined, limit: 20 });
      expect(result.items).toEqual([
        {
          id: userId,
          email: "user@example.com",
          name: "User",
          locale: "ja",
          systemRole: "USER",
          plan: "FREE",
          createdAt: "2026-07-07T00:00:00.000Z",
        },
      ]);
      expect(result.items[0]).not.toHaveProperty("passwordHash");
    });
  });

  describe("updateRole", () => {
    it("delegates to the usecase with the param id and body role", async () => {
      updateRoleExecute.mockResolvedValue({
        id: userId,
        email: "user@example.com",
        passwordHash: "hashed",
        name: "User",
        locale: "ja",
        systemRole: "EDITOR",
        plan: "FREE",
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.updateRole({ id: userId }, { systemRole: "EDITOR" });

      expect(updateRoleExecute).toHaveBeenCalledWith({ id: userId, systemRole: "EDITOR" });
      expect(result.systemRole).toBe("EDITOR");
    });
  });

  describe("updatePlan", () => {
    it("delegates to the usecase with the param id and body plan", async () => {
      updatePlanExecute.mockResolvedValue({
        id: userId,
        email: "user@example.com",
        passwordHash: "hashed",
        name: "User",
        locale: "ja",
        systemRole: "USER",
        plan: "PRO",
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.updatePlan({ id: userId }, { plan: "PRO" });

      expect(updatePlanExecute).toHaveBeenCalledWith({ id: userId, plan: "PRO" });
      expect(result.plan).toBe("PRO");
    });
  });
});
