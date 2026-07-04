import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationVersionSummary } from "./regulation-version.entity";
import type { Regulation, RegulationDetail, RegulationType } from "./regulation.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaRegulationRepository）。
 */
export const REGULATION_REPOSITORY = Symbol("REGULATION_REPOSITORY");

export interface RegulationListFilters {
  jurisdictionCode?: JurisdictionCode;
  type?: RegulationType;
  /** タイトル・文書番号への部分一致検索（設計書⑤ ?q=）。tagによるフィルタは未実装（tags/taggings未追加のため）。 */
  q?: string;
  /** カーソルページネーション（設計書⑤）: 前回応答の nextCursor をそのまま渡す。 */
  cursor?: string;
  limit: number;
}

export interface RegulationListResult {
  items: Regulation[];
  /** 次ページが無い場合は null（設計書⑤ カーソルページネーション）。 */
  nextCursor: string | null;
}

export interface RegulationVersionListFilters {
  /** versionNoを文字列化したキーセットカーソル（前回応答の nextCursor をそのまま渡す）。 */
  cursor?: string;
  limit: number;
}

export interface RegulationVersionListResult {
  items: RegulationVersionSummary[];
  nextCursor: string | null;
}

export interface RegulationRepository {
  findMany(filters: RegulationListFilters): Promise<RegulationListResult>;
  /** 設計書⑤ GET /api/v1/regulations/:id（最新版込み）。存在しない場合は null。 */
  findDetailById(id: string): Promise<RegulationDetail | null>;
  /** 設計書⑤ GET /api/v1/regulations/:id/versions（改正履歴）。対象regulationが存在しない場合は null。 */
  findVersions(
    regulationId: string,
    filters: RegulationVersionListFilters,
  ): Promise<RegulationVersionListResult | null>;
}
