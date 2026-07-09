/**
 * 組織種別（設計書④ organizations 準拠）。
 */
export type OrganizationType = "MAKER" | "MARKETING_HOLDER" | "IMPORTER" | "ACADEMIC";

/**
 * 組織内ロール（設計書⑦ 準拠）。
 */
export type OrgRole = "ORG_ADMIN" | "MEMBER";

/**
 * ユーザー所属ドメインエンティティ（設計書④ memberships 準拠、S19「組織」表示）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * S19は表示のみのスコープ（ユーザー承認済み）のため、参照先organizationの名称・種別を
 * あらかじめ展開した読み取り専用の形で保持する。
 */
export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  role: OrgRole;
}
