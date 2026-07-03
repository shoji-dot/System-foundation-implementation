import type { Request } from "express";

import type { AccessTokenPayload } from "../../core/domain/token-service";

/** JwtAuthGuard通過後、req.user にaccess tokenのclaimsが入る（設計書⑦ Guard 1段目通過後の状態）。 */
export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
