import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import type { PasswordHasher } from "../../core/domain/password-hasher";

/**
 * OWASP Password Storage Cheat Sheet の bcrypt 推奨値に準拠したコストファクタ。
 * 実装には bcryptjs（純JS実装）を使用する。ネイティブ依存の bcrypt はビルド時に
 * @mapbox/node-pre-gyp 経由で古い tar（high脆弱性6件、修正版がESM-onlyでCJS非互換のため
 * pin不可）を引き込むため、実行時コードに影響しないbcryptjsへ切替（ユーザー承認済み方針）。
 * ハッシュ形式（$2a$/$2b$）はbcrypt互換のため、既存のbcryptハッシュ済みパスワードも
 * そのまま検証可能。
 */
const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
