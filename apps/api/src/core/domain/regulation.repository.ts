import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationVersion, RegulationVersionSummary } from "./regulation-version.entity";
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

/** 版間差分用に取得する from/to 両版（本文・セクション込み）のペア。 */
export interface RegulationVersionDiffPair {
  from: RegulationVersion;
  to: RegulationVersion;
}

/**
 * 一般ユーザー向け公開API（設計書⑤ regulations系）が返すバージョンは、設計書⑧の編集ワークフロー
 * （draft → review → published）のうち status=PUBLISHED のもののみを対象とする。draft/review中の
 * 版は取込パイプライン(⑨)経由で作成されるが、editorのレビューを経るまで一般公開しない
 * （管理: 取込レビューS20向けの参照は別途専用のリポジトリメソッドで提供する）。
 */
export interface RegulationRepository {
  findMany(filters: RegulationListFilters): Promise<RegulationListResult>;
  /** 設計書⑤ GET /api/v1/regulations/:id（PUBLISHED最新版込み）。存在しない場合は null。 */
  findDetailById(id: string): Promise<RegulationDetail | null>;
  /** 設計書⑤ GET /api/v1/regulations/:id/versions（PUBLISHEDのみの改正履歴）。対象regulationが存在しない場合は null。 */
  findVersions(
    regulationId: string,
    filters: RegulationVersionListFilters,
  ): Promise<RegulationVersionListResult | null>;
  /**
   * 設計書⑤ GET /api/v1/regulations/:id/diff?from=&to=（PUBLISHED版間の差分）。
   * regulationが存在しない、または指定versionNoのいずれかが存在しない/PUBLISHEDでない場合は null。
   */
  findVersionsForDiff(
    regulationId: string,
    fromVersionNo: number,
    toVersionNo: number,
  ): Promise<RegulationVersionDiffPair | null>;
}
