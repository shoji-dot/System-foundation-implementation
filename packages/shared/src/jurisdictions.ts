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
