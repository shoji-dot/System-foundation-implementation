/**
 * パスワードハッシュ化のポート（domain側に定義し、infrastructureで実装する）。
 * usecase 層はハッシュアルゴリズム（bcrypt等）に依存しない。
 */
export const PASSWORD_HASHER = Symbol("PASSWORD_HASHER");

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
