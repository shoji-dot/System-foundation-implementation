/**
 * 法域ドメインエンティティ（設計書④ jurisdictions 準拠）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type JurisdictionCode = "JP" | "US" | "EU" | "UK" | "CA" | "AU" | "CN" | "KR" | "TW" | "SG";

export interface Jurisdiction {
  id: string;
  code: JurisdictionCode;
  name: string;
  authority: string;
  createdAt: Date;
  updatedAt: Date;
}
