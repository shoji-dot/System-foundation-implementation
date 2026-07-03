import { Inject, Injectable } from "@nestjs/common";

import type { TokenRevocationStore } from "../domain/token-revocation-store";
import { TOKEN_REVOCATION_STORE } from "../domain/token-revocation-store";
import type { TokenService } from "../domain/token-service";
import { TOKEN_SERVICE } from "../domain/token-service";

import { remainingTtlSeconds } from "./remaining-ttl-seconds.util";

/**
 * logout（設計書⑤ POST /api/v1/auth/logout）。
 * 渡されたrefresh tokenのjtiをRedis失効リストに登録し、以後の refresh/再利用を不可にする。
 * 既に無効・期限切れのトークンが渡された場合も「ログアウト状態」自体は満たされているため、
 * エラーにはせず冪等に成功させる。
 */
@Injectable()
export class LogoutUserUsecase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(TOKEN_REVOCATION_STORE) private readonly revocationStore: TokenRevocationStore,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      await this.revocationStore.revoke(payload.jti, remainingTtlSeconds(payload.expiresAt));
    } catch {
      // 既に無効なトークン: 何もしなくてもログアウト状態と同義のため成功扱い（冪等）。
    }
  }
}
