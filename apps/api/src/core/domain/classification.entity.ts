import type { JurisdictionCode } from "./jurisdiction.entity";

/**
 * 機器分類ドメインエンティティ（設計書④ device_classifications 準拠、S08/S09）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type ClassificationScheme = "JMDN" | "FDA_PRODUCT_CODE" | "EMDN" | "GMDN";

/** 一覧表示に埋め込む法域の最小情報（Regulationと同形、設計書④の抽象化方針に合わせて共通化）。 */
export interface ClassificationJurisdictionSummary {
  code: JurisdictionCode;
  name: string;
}

export interface Classification {
  id: string;
  jurisdiction: ClassificationJurisdictionSummary;
  scheme: ClassificationScheme;
  code: string;
  name: string;
  /** リスク分類（例: JPクラスI-IV、FDA Class I-III）。スキームごとに表記が異なるため自由記述。 */
  class: string | null;
  definition: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 分類間マッピング1件（相手側分類の全情報＋信頼度）。設計書④ classification_mappings 準拠。 */
export interface ClassificationMappingSummary {
  id: string;
  confidence: number;
  /** マッピング先（自分以外）の分類。方向性は保持しないため常に「相手側」を返す。 */
  classification: Classification;
}
