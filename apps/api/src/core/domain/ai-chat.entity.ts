import type { JurisdictionCode } from "./jurisdiction.entity";

/**
 * AIチャットドメインエンティティ（設計書⑤⑥ POST /api/v1/ai/chat、S14）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * Prisma schema の AiChatMessageRole 列挙値（USER/ASSISTANT）とそのまま一致させる。
 */
export type AiChatMessageRole = "USER" | "ASSISTANT";

/**
 * 出典（設計書⑥「回答には必ず出典を付与」）。regulation_sections 1件に対応する。
 */
export interface AiChatCitation {
  sectionId: string;
  regulationId: string;
  regulationTitle: string;
  jurisdiction: { code: JurisdictionCode; name: string };
  versionNo: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  /** 条・項・号の階層パス（例: 第23条の2/第1項/第2号）。 */
  path: string;
  heading: string;
}

export interface AiChatMessage {
  id: string;
  role: AiChatMessageRole;
  content: string;
  citations: AiChatCitation[] | null;
  createdAt: Date;
}
