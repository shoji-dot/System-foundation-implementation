/**
 * 機器分類スキーム（設計書 ④ device_classifications 準拠）。
 * MVPはJMDN(JP)のみ運用、他スキームはスキーマ・型として先行定義する。
 */
export const CLASSIFICATION_SCHEMES = ["JMDN", "FDA_PRODUCT_CODE", "EMDN", "GMDN"] as const;
export type ClassificationScheme = (typeof CLASSIFICATION_SCHEMES)[number];
