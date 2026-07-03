import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import type { SystemRole } from "../../core/domain/user.entity";

import type { AuthenticatedRequest } from "./authenticated-request";
import { RolesGuard } from "./roles.guard";

function createContext(systemRole?: SystemRole): ExecutionContext {
  const request = {
    user: systemRole
      ? { userId: "u1", email: "user@example.com", systemRole, plan: "FREE" }
      : undefined,
  } as unknown as AuthenticatedRequest;

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  function setup(requiredRoles: SystemRole[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    return { guard };
  }

  it("allows access when the handler has no @Roles restriction", () => {
    const { guard } = setup(undefined);
    expect(guard.canActivate(createContext("USER"))).toBe(true);
  });

  it("allows access when the user has one of the required roles", () => {
    const { guard } = setup(["ADMIN", "EDITOR"]);
    expect(guard.canActivate(createContext("EDITOR"))).toBe(true);
  });

  it("throws ForbiddenException when the user lacks a required role", () => {
    const { guard } = setup(["ADMIN"]);
    expect(() => guard.canActivate(createContext("USER"))).toThrow(ForbiddenException);
  });

  it("throws UnauthorizedException when there is no authenticated user", () => {
    const { guard } = setup(["ADMIN"]);
    expect(() => guard.canActivate(createContext(undefined))).toThrow(UnauthorizedException);
  });
});
