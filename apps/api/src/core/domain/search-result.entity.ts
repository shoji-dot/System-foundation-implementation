import type { ClassificationScheme } from "./classification.entity";
import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationStatus, RegulationType } from "./regulation.entity";

/**
 * 統合検索ドメインエンティティ（設計書⑤⑩ GET /api/v1/search、S05）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * regulations/classifications を横断する検索結果を discriminated union で表現する。
 * learning（courses/lessons）は当該テーブル未実装のため今回は結果を返さない（常に空、下記SearchFilters参照）。
 */

interface SearchResultJurisdiction {
  code: JurisdictionCode;
  name: string;
}

export interface RegulationSearchResult {
  type: "regulation";
  id: string;
  jurisdiction: SearchResultJurisdiction;
  regulationType: RegulationType;
  title: string;
  docNumber: string | null;
  status: RegulationStatus;
  effectiveDate: Date | null;
}

export interface ClassificationSearchResult {
  type: "classification";
  id: string;
  jurisdiction: SearchResultJurisdiction;
  scheme: ClassificationScheme;
  code: string;
  name: string;
  class: string | null;
}

export type SearchResultItem = RegulationSearchResult | ClassificationSearchResult;
