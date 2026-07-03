import { z } from "zod";

import { JURISDICTION_CODES } from "./jurisdictions";

/**
 * ヘルスチェック応答スキーマ（Phase 0: 起動確認用）。
 */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/**
 * カーソルページネーション共通クエリ（設計書 ⑤ API構成 準拠）。
 */
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

/**
 * 法域コード Zod スキーマ。
 */
export const jurisdictionCodeSchema = z.enum(JURISDICTION_CODES);
