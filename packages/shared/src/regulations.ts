/**
 * 法規文書の種別・ステータス（設計書 ④ regulations 準拠）。
 */
export const REGULATION_TYPES = ["LAW", "ORDINANCE", "NOTICE", "GUIDANCE", "STANDARD"] as const;
export type RegulationType = (typeof REGULATION_TYPES)[number];

export const REGULATION_STATUSES = ["ACTIVE", "AMENDED", "REPEALED"] as const;
export type RegulationStatus = (typeof REGULATION_STATUSES)[number];

/**
 * 法規文書種別の日本語表示名。フロントエンドの複数箇所（S18通知設定の登録フォーム・一覧）で
 * 共通利用するため、DRY原則に基づきここに集約する。
 */
export const REGULATION_TYPE_LABELS: Record<RegulationType, string> = {
  LAW: "法律",
  ORDINANCE: "政令・省令",
  NOTICE: "通知",
  GUIDANCE: "ガイダンス",
  STANDARD: "基準",
};

/**
 * 法規文書ステータスの日本語表示名。フロントエンドの複数箇所（S06一覧・S07詳細）で
 * 共通利用するため、DRY原則に基づきここに集約する（REGULATION_TYPE_LABELSと同じ方針）。
 */
export const REGULATION_STATUS_LABELS: Record<RegulationStatus, string> = {
  ACTIVE: "現行",
  AMENDED: "改正済み",
  REPEALED: "廃止",
};
