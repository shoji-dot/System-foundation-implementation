import type { JurisdictionCode } from "./jurisdiction.entity";
import type { Plan, Profession, SystemRole, User } from "./user.entity";

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

/** ユーザー一覧のカーソルページネーション入力（設計書⑫、他一覧APIと同様の方式）。 */
export interface ListUsersFilters {
  cursor?: string;
  limit: number;
}

export interface UserListResult {
  items: User[];
  nextCursor: string | null;
}

/** 設計書⑫ S03「オンボーディング」完了入力（職能・関心国）。 */
export interface CompleteOnboardingInput {
  profession: Profession;
  interestedJurisdictions: JurisdictionCode[];
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  /** refresh token の sub(userId) からユーザーを引く（設計書⑤ /auth/refresh）。 */
  findById(id: string): Promise<User | null>;
  create(input: NewUser): Promise<User>;
  /** 設計書⑫ S21「ユーザー管理」一覧（ADMIN限定）。 */
  list(filters: ListUsersFilters): Promise<UserListResult>;
  /** 設計書⑫ S21「ユーザー管理」ロール変更（ADMIN限定）。 */
  updateRole(id: string, systemRole: SystemRole): Promise<User>;
  /** 設計書⑫ S21「ユーザー管理」プラン変更（ADMIN限定）。 */
  updatePlan(id: string, plan: Plan): Promise<User>;
  /** 設計書⑫ S03「オンボーディング」完了（職能・関心国を保存し、onboardingCompletedAtを設定）。 */
  completeOnboarding(id: string, input: CompleteOnboardingInput): Promise<User>;
}
