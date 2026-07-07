import type { JurisdictionCode } from "./jurisdiction.entity";

/**
 * 実務支援プロジェクトドメインエンティティ（設計書④ user_projects 準拠、⑫ S15/S16、S04「プロジェクト概況」）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * 設計書のorg_idは必須列だが、signup時にOrganizationが自動作成されないため、organizationIdはnullableとする
 * （組織未所属ユーザーは個人プロジェクトとしてnullになる。ユーザー承認済み）。
 */
export interface Project {
  id: string;
  name: string;
  deviceClass: string | null;
  targetJurisdictions: JurisdictionCode[];
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
