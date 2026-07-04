import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationVersion } from "./regulation-version.entity";

/**
 * 法規文書ドメインエンティティ（設計書④ regulations 準拠）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type RegulationType = "LAW" | "ORDINANCE" | "NOTICE" | "GUIDANCE" | "STANDARD";
export type RegulationStatus = "ACTIVE" | "AMENDED" | "REPEALED";

/** 一覧表示に埋め込む法域の最小情報。 */
export interface RegulationJurisdictionSummary {
  code: JurisdictionCode;
  name: string;
}

export interface Regulation {
  id: string;
  jurisdiction: RegulationJurisdictionSummary;
  type: RegulationType;
  /** 国別の文書タイプ差分吸収用（設計書⑧: 例 FDA Guidance, EU MDCG）。 */
  subtype: string | null;
  title: string;
  docNumber: string | null;
  status: RegulationStatus;
  effectiveDate: Date | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 法規文書詳細（設計書⑤ GET /api/v1/regulations/:id、最新版）。
 * 関連文書(regulation_relations)・タグは今回は対象外（別コミットで追加予定）。
 */
export interface RegulationDetail extends Regulation {
  /** 最新版（versionNo最大）。データ不整合でバージョンが1件も無い場合のみ null。 */
  latestVersion: RegulationVersion | null;
}
