import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import type {
  AccessTokenPayload,
  IssuedTokenPair,
  RefreshTokenPayload,
  TokenPayload,
  TokenService,
} from "../../core/domain/token-service";
import { InvalidTokenError } from "../../core/domain/token-service";
import type { Plan, SystemRole } from "../../core/domain/user.entity";

/**
 * 設計書⑦: セッションはJWT（短命 access 15分 + refresh 30日）。
 * access/refresh で別々の秘密鍵を用いる（片方の漏洩がもう片方に波及しないようにするため）。
 * refresh token には jti を付与し、Redis失効リスト（logout/refreshローテーション）で使用する。
 */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL = "30d";

interface AccessTokenClaims {
  sub: string;
  email: string;
  systemRole: SystemRole;
  plan: Plan;
  type: string;
}

interface RefreshTokenClaims {
  sub: string;
  jti: string;
  type: string;
  exp: number;
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueTokenPair(payload: TokenPayload): Promise<IssuedTokenPair> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: payload.userId,
        email: payload.email,
        systemRole: payload.systemRole,
        plan: payload.plan,
        type: "access",
      },
      { secret: this.requireSecret("JWT_ACCESS_SECRET"), expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: payload.userId,
        jti: randomUUID(),
        type: "refresh",
      },
      { secret: this.requireSecret("JWT_REFRESH_SECRET"), expiresIn: REFRESH_TOKEN_TTL },
    );

    return { accessToken, refreshToken, accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    let claims: AccessTokenClaims;
    try {
      claims = await this.jwtService.verifyAsync<AccessTokenClaims>(token, {
        secret: this.requireSecret("JWT_ACCESS_SECRET"),
      });
    } catch {
      throw new InvalidTokenError("access token verification failed");
    }

    if (claims.type !== "access") {
      throw new InvalidTokenError("token is not an access token");
    }

    return {
      userId: claims.sub,
      email: claims.email,
      systemRole: claims.systemRole,
      plan: claims.plan,
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    let claims: RefreshTokenClaims;
    try {
      claims = await this.jwtService.verifyAsync<RefreshTokenClaims>(token, {
        secret: this.requireSecret("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new InvalidTokenError("refresh token verification failed");
    }

    if (claims.type !== "refresh") {
      throw new InvalidTokenError("token is not a refresh token");
    }

    return {
      userId: claims.sub,
      jti: claims.jti,
      expiresAt: new Date(claims.exp * 1000),
    };
  }

  private requireSecret(key: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`${key} is not set. see .env.example`);
    }
    return value;
  }
}
