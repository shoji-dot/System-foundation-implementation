import { z } from "zod";

import {
  cursorPaginationQuerySchema,
  jurisdictionCodeSchema,
  jurisdictionSummaryResponseSchema,
  regulationStatusSchema,
  regulationTypeSchema,
} from "./schemas";

/**
 * GET /api/v1/updates クエリ（設計書⑤ ?since= 準拠）。
 * jurisdiction/typeはS17「国別新着・改正」の絞り込みのため、regulations一覧(?jurisdiction=&type=)と
 * 同様の慣例で追加する。
 */
export const listUpdatesQuerySchema = cursorPaginationQuerySchema.extend({
  since: z.string().datetime().optional(),
  jurisdiction: jurisdictionCodeSchema.optional(),
  type: regulationTypeSchema.optional(),
});
export type ListUpdatesQuery = z.infer<typeof listUpdatesQuerySchema>;

/**
 * 更新フィード項目応答（設計書④ regulation_versions 準拠、GET /api/v1/updates、S04/S17）。
 * PUBLISHED済みのバージョンを「新着・改正」として表現する。
 */
export const updateFeedItemResponseSchema = z.object({
  versionId: z.string().uuid(),
  regulationId: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  type: regulationTypeSchema,
  title: z.string(),
  docNumber: z.string().nullable(),
  versionNo: z.number().int().positive(),
  changeSummary: z.string().nullable(),
  publishedAt: z.string().datetime(),
  effectiveFrom: z.string().date(),
  regulationStatus: regulationStatusSchema,
});
export type UpdateFeedItemResponse = z.infer<typeof updateFeedItemResponseSchema>;

/**
 * カーソルページネーション応答（更新フィード、設計書⑤ GET /api/v1/updates）。
 */
export const updateFeedListResponseSchema = z.object({
  items: z.array(updateFeedItemResponseSchema),
  nextCursor: z.string().nullable(),
});
export type UpdateFeedListResponse = z.infer<typeof updateFeedListResponseSchema>;

/**
 * 更新通知の配信頻度 Zod スキーマ（設計書⑤ POST /api/v1/subscriptions、S18準拠）。
 */
export const UPDATE_FREQUENCIES = ["REALTIME", "DAILY", "WEEKLY"] as const;
export const updateFrequencySchema = z.enum(UPDATE_FREQUENCIES);
export type UpdateFrequency = z.infer<typeof updateFrequencySchema>;

/**
 * POST /api/v1/subscriptions リクエスト（設計書⑤、S18「購読国・タイプ・頻度」）。
 * jurisdiction/regulationTypeを省略した場合はそれぞれ「全国」「全タイプ」購読を意味する。
 */
export const createSubscriptionRequestSchema = z.object({
  jurisdiction: jurisdictionCodeSchema.optional(),
  regulationType: regulationTypeSchema.optional(),
  frequency: updateFrequencySchema,
});
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionRequestSchema>;

/**
 * 購読応答（設計書⑤ POST /api/v1/subscriptions）。
 */
export const subscriptionResponseSchema = z.object({
  id: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema.nullable(),
  regulationType: regulationTypeSchema.nullable(),
  frequency: updateFrequencySchema,
  createdAt: z.string().datetime(),
});
export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;
