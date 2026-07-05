import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationStatus, RegulationType } from "./regulation.entity";

/**
 * 更新フィード項目ドメインエンティティ（設計書④ regulation_versions 準拠、GET /api/v1/updates、S04/S17）。
 * PUBLISHED済みのバージョンを「新着・改正」として表現する。
 */
export interface UpdateFeedItem {
  versionId: string;
  regulationId: string;
  jurisdiction: { code: JurisdictionCode; name: string };
  type: RegulationType;
  title: string;
  docNumber: string | null;
  versionNo: number;
  changeSummary: string | null;
  publishedAt: Date;
  effectiveFrom: Date;
  regulationStatus: RegulationStatus;
}
