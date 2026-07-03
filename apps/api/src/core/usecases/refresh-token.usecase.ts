import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";

import type { TokenRevocationStore } from "../domain/token-revocation-store";
import { TOKEN_REVOCATION_STORE } from "../domain/token-revocation-store";
import type { IssuedTokenPair, RefreshTokenPayload, TokenService } from "../domain/token-service";
import { TOKEN_SERVICE } from "../domain/token-service";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

import { remainingTtlSeconds } from "./remaining-ttl-seconds.util";

const INVALID_REFRESH_TOKEN_MESSAGE = "リフレッシュトークンが無効です。再度ログインしてください。";

/**
 * refresh（設計書⑤ POST /api/v1/auth/refresh）。
 * ローテーション方式: 使用済みのrefresh tokenは即座に失効させ、新しいペアを発行する
 * （漏洩したrefresh tokenの使い回し・リプレイ攻撃対策）。
 */
@Injectable()
export class RefreshTokenUsecase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(TOKEN_REVOCATION_STORE) private readonly revocationStore: TokenRevocationStore,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<IssuedTokenPair> {
    const payload = await this.verify(refreshToken);

    if (await this.revocationStore.isRevoked(payload.jti)) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    await this.revocationStore.revoke(payload.jti, remainingTtlSeconds(payload.expiresAt));

    return this.tokenService.issueTokenPair({
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      plan: user.plan,
    });
  }

  private async verify(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      return await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }
  }
}
