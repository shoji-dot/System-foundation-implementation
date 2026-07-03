/**
 * 法規文書の種別・ステータス（設計書 ④ regulations 準拠）。
 */
export const REGULATION_TYPES = ["LAW", "ORDINANCE", "NOTICE", "GUIDANCE", "STANDARD"] as const;
export type RegulationType = (typeof REGULATION_TYPES)[number];

export const REGULATION_STATUSES = ["ACTIVE", "AMENDED", "REPEALED"] as const;
export type RegulationStatus = (typeof REGULATION_STATUSES)[number];
