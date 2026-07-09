import type { JurisdictionCode } from "./jurisdiction.entity";

/**
 * ユーザードメインエンティティ（設計書④ users 準拠）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type SystemRole = "ADMIN" | "EDITOR" | "USER";
// Phase7 ⑦-1: BUSINESS追加（設計変更書_ライフサイクル管理_SaaS化.md ⑥ プラン分離 準拠、Prisma Plan enumと同期）。
export type Plan = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
/** 職能属性（設計書⑦、権限ではなく表示パーソナライズに使用、S03オンボーディングで選択）。 */
export type Profession =
  "REGULATORY" | "QA" | "SAFETY" | "SALES" | "DESIGN" | "MEDICAL" | "ACADEMIC";

export interface User {
  id: string;
  email: string;
  /** OAuthのみでサインアップしたユーザーは null（設計書⑦）。 */
  passwordHash: string | null;
  name: string;
  locale: string;
  systemRole: SystemRole;
  plan: Plan;
  /** S03オンボーディング未完了の間は null。 */
  profession: Profession | null;
  interestedJurisdictions: JurisdictionCode[];
  /** S03オンボーディング完了時刻。未完了ユーザーの判定・S04等へのリダイレクトゲートに使用。 */
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** パスワードハッシュ等の非公開情報を除いた、応答・Guard間受け渡しに使う公開ユーザー像。 */
export type PublicUser = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "locale"
  | "systemRole"
  | "plan"
  | "profession"
  | "interestedJurisdictions"
  | "onboardingCompletedAt"
  | "createdAt"
>;
