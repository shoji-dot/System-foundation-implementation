import { SetMetadata } from "@nestjs/common";

import type { SystemRole } from "../../core/domain/user.entity";

/** 設計書⑦ システムロール（admin/editor/user）でエンドポイントを制限する。RolesGuardと併用する。 */
export const ROLES_KEY = "roles";
export const Roles = (...roles: SystemRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
