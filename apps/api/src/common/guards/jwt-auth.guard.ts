import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";

import { TOKEN_SERVICE } from "../../core/domain/token-service";
import type { TokenService } from "../../core/domain/token-service";

import type { AuthenticatedRequest } from "./authenticated-request";

const BEARER_PREFIX = "Bearer ";

/**
 * 設計書⑦ API保護 Guard 1段目: JWT検証。
 * Authorization: Bearer <accessToken> を検証し、成功したら req.user にclaimsを格納する。
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("認証が必要です。");
    }

    try {
      request.user = await this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException("認証トークンが無効です。");
    }

    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      return undefined;
    }
    return header.slice(BEARER_PREFIX.length);
  }
}
