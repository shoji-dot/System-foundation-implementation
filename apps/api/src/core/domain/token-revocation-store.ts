/**
 * refresh token 失効リストのポート（設計書⑦ 準拠、Redisで実装）。
 * jti単位で失効を記録し、logout/refreshローテーション時に使用する。
 */
export const TOKEN_REVOCATION_STORE = Symbol("TOKEN_REVOCATION_STORE");

export interface TokenRevocationStore {
  /** ttlSeconds はトークン自体の残り有効期限に合わせる（失効記録が本体より長生きしないように）。 */
  revoke(jti: string, ttlSeconds: number): Promise<void>;
  isRevoked(jti: string): Promise<boolean>;
}
