import { z } from "zod";

import {
  jurisdictionSummaryResponseSchema,
  regulationStatusSchema,
  regulationTypeSchema,
} from "./schemas";

/**
 * 編集ワークフロー状態のうち、校閲待ちキュー（S20）の対象となるもの。
 * PUBLISHED済みの版は一般公開APIの対象のためここには含まない（設計書⑧）。
 */
export const pendingReviewStatusSchema = z.enum(["DRAFT", "REVIEW"]);
export type PendingReviewStatus = z.infer<typeof pendingReviewStatusSchema>;

/**
 * GET /api/v1/admin/ingestion/versions クエリ（設計書⑫ S20、カーソルページネーション準拠）。
 */
export const listPendingReviewVersionsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPendingReviewVersionsQuery = z.infer<typeof listPendingReviewVersionsQuerySchema>;

/**
 * 校閲対象版パラメータ（設計書⑫ S20、UUID検証）。
 */
export const pendingReviewVersionIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type PendingReviewVersionIdParam = z.infer<typeof pendingReviewVersionIdParamSchema>;

/**
 * 取込レビュー一覧項目応答（設計書⑫ S20、GET /api/v1/admin/ingestion/versions）。
 * 本文(fullText)は一覧では返さず、詳細取得時に返す（regulations一覧のfullText扱いに準拠）。
 */
export const pendingReviewVersionResponseSchema = z.object({
  id: z.string().uuid(),
  regulationId: z.string().uuid(),
  regulationTitle: z.string(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  type: regulationTypeSchema,
  status: pendingReviewStatusSchema,
  versionNo: z.number().int().positive(),
  effectiveFrom: z.string().date(),
  changeSummary: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type PendingReviewVersionResponse = z.infer<typeof pendingReviewVersionResponseSchema>;

/**
 * カーソルページネーション応答（取込レビュー一覧、設計書⑫ S20）。
 */
export const pendingReviewVersionListResponseSchema = z.object({
  items: z.array(pendingReviewVersionResponseSchema),
  nextCursor: z.string().nullable(),
});
export type PendingReviewVersionListResponse = z.infer<
  typeof pendingReviewVersionListResponseSchema
>;

/**
 * 現行公開版（比較対象）応答。まだ一度も公開されていない新規規制の場合は null。
 */
export const currentPublishedVersionResponseSchema = z.object({
  versionId: z.string().uuid(),
  versionNo: z.number().int().positive(),
  fullText: z.string(),
  effectiveFrom: z.string().date(),
});

/**
 * 取込レビュー詳細応答（設計書⑫ S20、GET /api/v1/admin/ingestion/versions/:id）。
 * 校閲対象版の本文と、比較用の現行公開版（あれば）を並べて返す。
 */
export const pendingReviewVersionDetailResponseSchema = pendingReviewVersionResponseSchema.extend({
  fullText: z.string(),
  currentPublished: currentPublishedVersionResponseSchema.nullable(),
});
export type PendingReviewVersionDetailResponse = z.infer<
  typeof pendingReviewVersionDetailResponseSchema
>;

/**
 * 公開実行時にクローズされた旧公開版の情報。旧公開版が無かった場合（初版公開）はnull。
 */
export const closedPreviousVersionResponseSchema = z.object({
  versionId: z.string().uuid(),
  effectiveTo: z.string().date(),
});

/**
 * 公開(publish)応答（設計書⑫ S20、POST /api/v1/admin/ingestion/versions/:id/publish）。
 * regulationStatusは公開実行後のRegulation.status（旧公開版があればAMENDED、無ければACTIVE）。
 */
export const publishPendingReviewVersionResponseSchema = z.object({
  regulationId: z.string().uuid(),
  versionId: z.string().uuid(),
  versionNo: z.number().int().positive(),
  status: z.literal("PUBLISHED"),
  publishedAt: z.string().datetime(),
  effectiveFrom: z.string().date(),
  regulationStatus: regulationStatusSchema,
  closedPreviousVersion: closedPreviousVersionResponseSchema.nullable(),
});
export type PublishPendingReviewVersionResponse = z.infer<
  typeof publishPendingReviewVersionResponseSchema
>;
