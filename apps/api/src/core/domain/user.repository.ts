import type { User } from "./user.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（例: PrismaUserRepository）。
 */
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface NewUser {
  email: string;
  passwordHash: string;
  name: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  /** refresh token の sub(userId) からユーザーを引く（設計書⑤ /auth/refresh）。 */
  findById(id: string): Promise<User | null>;
  create(input: NewUser): Promise<User>;
}
