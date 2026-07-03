import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

import type { PasswordHasher } from "../../core/domain/password-hasher";

/** OWASP Password Storage Cheat Sheet の bcrypt 推奨値に準拠したコストファクタ。 */
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
