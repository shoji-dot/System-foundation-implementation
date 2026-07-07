/**
 * 機器分類スキーム（設計書 ④ device_classifications 準拠）。
 * MVPはJMDN(JP)のみ運用、他スキームはスキーマ・型として先行定義する。
 */
export const CLASSIFICATION_SCHEMES = ["JMDN", "FDA_PRODUCT_CODE", "EMDN", "GMDN"] as const;
export type ClassificationScheme = (typeof CLASSIFICATION_SCHEMES)[number];

/**
 * 機器分類スキームの表示名（設計書④「国別スキームを同一テーブルで抽象化」準拠）。
 * S09「各国マッピング表示」でどの国のスキームか分かるよう、フロントエンドの複数箇所で
 * 共通利用するため、DRY原則に基づきここに集約する（REGULATION_TYPE_LABELSと同じ方針）。
 */
export const CLASSIFICATION_SCHEME_LABELS: Record<ClassificationScheme, string> = {
  JMDN: "JMDN（日本）",
  FDA_PRODUCT_CODE: "FDA Product Code（米国）",
  EMDN: "EMDN（欧州）",
  GMDN: "GMDN（国際）",
};
