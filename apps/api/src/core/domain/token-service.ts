import type { Plan, SystemRole } from "./user.entity";

/**
 * JWT発行のポート（domain側に定義し、infrastructureで実装する）。
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

export interface TokenService {
  issueTokenPair(payload: TokenPayload): Promise<IssuedTokenPair>;
}
