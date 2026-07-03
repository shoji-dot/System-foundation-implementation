import type { Plan, SystemRole } from "./user.entity";

/**
 * JWT発行・検証のポート（domain側に定義し、infrastructureで実装する）。
 * usecase層はJWTライブラリ（@nestjs/jwt等）に直接依存しない。
 */
export const TOKEN_SERVICE = Symbol("TOKEN_SERVICE");

export interface TokenPayload {
  userId: string;
  email: string;
  systemRole: SystemRole;
  plan: Plan;
}

export interface IssuedTokenPair {
  accessToken: string;
  refreshToken: string;
  /** access token の有効期限（秒）。レスポンス組み立て用。 */
  accessTokenExpiresIn: number;
}

export interface RefreshTokenPayload {
  userId: string;
  /** 失効リスト（Redis）でのキーに使うトークン固有ID。 */
  jti: string;
  expiresAt: Date;
}

/** refresh token の署名検証失敗・期限切れ・型不一致をまとめて表す（HTTP例外への変換はusecase層で行う）。 */
export class InvalidTokenError extends Error {}

export interface TokenService {
  issueTokenPair(payload: TokenPayload): Promise<IssuedTokenPair>;
  /** @throws {InvalidTokenError} 署名不正・期限切れ・refresh以外のtypeの場合 */
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
