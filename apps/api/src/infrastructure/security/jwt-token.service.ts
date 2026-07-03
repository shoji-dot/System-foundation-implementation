import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import type {
  IssuedTokenPair,
  TokenPayload,
  TokenService,
} from "../../core/domain/token-service";

/**
 * 設計書⑦: セッションはJWT（短命 access 15分 + refresh 30日）。
 * access/refresh で別々の秘密鍵を用いる（片方の漏洩がもう片方に波及しないようにするため）。
 * refresh token には jti を付与する（将来のRedis失効リスト実装 [logout/refresh コミット] で使用）。
 */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL = "30d";

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

  private requireSecret(key: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`${key} is not set. see .env.example`);
    }
    return value;
  }
}
