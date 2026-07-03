/**
 * ユーザードメインエンティティ（設計書④ users 準拠）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type SystemRole = "ADMIN" | "EDITOR" | "USER";
export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export interface User {
  id: string;
  email: string;
  /** OAuthのみでサインアップしたユーザーは null（設計書⑦）。 */
  passwordHash: string | null;
  name: string;
  locale: string;
  systemRole: SystemRole;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

/** パスワードハッシュ等の非公開情報を除いた、応答・Guard間受け渡しに使う公開ユーザー像。 */
export type PublicUser = Pick<
  User,
  "id" | "email" | "name" | "locale" | "systemRole" | "plan" | "createdAt"
>;
