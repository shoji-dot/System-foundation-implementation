import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { SystemRole } from "../../core/domain/user.entity";
import { ROLES_KEY } from "../decorators/roles.decorator";

import type { AuthenticatedRequest } from "./authenticated-request";

/**
 * 設計書⑦ API保護 Guard 2段目: RBAC。
 * @Roles(...) が付いていないハンドラは制限しない（認証要求自体はJwtAuthGuardの責務）。
 * JwtAuthGuardの後段で使う前提（req.user が必要）。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException("認証が必要です。");
    }

    if (!requiredRoles.includes(request.user.systemRole)) {
      throw new ForbiddenException("この操作を行う権限がありません。");
    }

    return true;
  }
}
