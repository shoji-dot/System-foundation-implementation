import type {
  Classification,
  ClassificationMappingSummary,
  ClassificationScheme,
} from "./classification.entity";
import type { JurisdictionCode } from "./jurisdiction.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaClassificationRepository）。
 */
export const CLASSIFICATION_REPOSITORY = Symbol("CLASSIFICATION_REPOSITORY");

export interface ClassificationListFilters {
  scheme?: ClassificationScheme;
  jurisdictionCode?: JurisdictionCode;
  /** コード・名称・定義への部分一致検索（設計書⑤ ?q=）。 */
  q?: string;
  /** カーソルページネーション（設計書⑤）: 前回応答の nextCursor をそのまま渡す。 */
  cursor?: string;
  limit: number;
}

export interface ClassificationListResult {
  items: Classification[];
  /** 次ページが無い場合は null（設計書⑤ カーソルページネーション）。 */
  nextCursor: string | null;
}

export interface ClassificationRepository {
  findMany(filters: ClassificationListFilters): Promise<ClassificationListResult>;
  /**
   * 設計書⑤に明記は無いがS09「分類詳細」表示に必要なためユーザー承認済みで追加
   * （GET /api/v1/classifications/:id、RegulationRepository.findDetailByIdと同じ方針）。
   * 存在しない場合はnull。
   */
  findById(id: string): Promise<Classification | null>;
  /**
   * 設計書⑤ GET /api/v1/classifications/:id/mappings（S09、各国マッピング）。
   * 対象classificationが存在しない場合は null。件数が少ないためページネーションは行わない
   * （jurisdictions一覧と同様の判断、設計書⑤ 共通仕様のカーソルページネーションは対象外とする）。
   */
  findMappingsByClassificationId(
    classificationId: string,
  ): Promise<ClassificationMappingSummary[] | null>;
}
