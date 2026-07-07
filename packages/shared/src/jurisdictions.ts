/**
 * 対応法域コード（設計書 ④ データベース構成 / jurisdictions 準拠）。
 * MVP は JP のみ稼働、他国はスキーマ・型として先行定義する。
 */
export const JURISDICTION_CODES = [
  "JP",
  "US",
  "EU",
  "UK",
  "CA",
  "AU",
  "CN",
  "KR",
  "TW",
  "SG",
] as const;

export type JurisdictionCode = (typeof JURISDICTION_CODES)[number];

/**
 * 法域コードの日本語表示名（MVPはJPのみ稼働、設計書⑨。他国はスキーマ・UIとして先行対応）。
 * フロントエンドの複数箇所（S15プロジェクト作成、S18通知設定）で共通利用するため、
 * DRY原則に基づきここに集約する。
 */
export const JURISDICTION_LABELS: Record<JurisdictionCode, string> = {
  JP: "日本",
  US: "米国",
  EU: "EU",
  UK: "英国",
  CA: "カナダ",
  AU: "オーストラリア",
  CN: "中国",
  KR: "韓国",
  TW: "台湾",
  SG: "シンガポール",
};
