import { z } from "zod";

/**
 * タグ付け対象種別（設計書④ taggings のpolymorphic対象）。管理画面(S21)から編集可能な
 * lessonのみ今回実装する（regulation/classificationは編集画面が未実装のため対象外、ユーザー承認済み）。
 */
export const TAGGABLE_TYPES = ["LESSON"] as const;
export type TaggableType = (typeof TAGGABLE_TYPES)[number];

/**
 * タグ応答（設計書④ tags 準拠、S21「タグ管理」）。
 */
export const tagResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TagResponse = z.infer<typeof tagResponseSchema>;

/**
 * GET /api/v1/admin/tags クエリ（カーソルページネーション、他一覧APIと同様の方式）。
 */
export const listTagsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;

/**
 * カーソルページネーション応答（タグ一覧、GET /api/v1/admin/tags）。
 */
export const tagListResponseSchema = z.object({
  items: z.array(tagResponseSchema),
  nextCursor: z.string().nullable(),
});
export type TagListResponse = z.infer<typeof tagListResponseSchema>;

/**
 * POST /api/v1/admin/tags リクエストボディ。
 */
export const createTagRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
});
export type CreateTagRequest = z.infer<typeof createTagRequestSchema>;

/**
 * PATCH /api/v1/admin/tags/:id リクエストボディ。
 */
export const updateTagRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
});
export type UpdateTagRequest = z.infer<typeof updateTagRequestSchema>;

/**
 * タグIDパラメータ（GET/PATCH/DELETE /api/v1/admin/tags/:id 共通）。
 */
export const tagIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type TagIdParam = z.infer<typeof tagIdParamSchema>;

/**
 * レッスンIDパラメータ（GET/POST /api/v1/admin/lessons/:lessonId/tags 共通）。
 */
export const lessonTagsParamSchema = z.object({
  lessonId: z.string().uuid(),
});
export type LessonTagsParam = z.infer<typeof lessonTagsParamSchema>;

/**
 * レッスンID・タグIDパラメータ（DELETE /api/v1/admin/lessons/:lessonId/tags/:tagId）。
 */
export const lessonTagParamSchema = z.object({
  lessonId: z.string().uuid(),
  tagId: z.string().uuid(),
});
export type LessonTagParam = z.infer<typeof lessonTagParamSchema>;

/**
 * POST /api/v1/admin/lessons/:lessonId/tags リクエストボディ。
 */
export const attachTagToLessonRequestSchema = z.object({
  tagId: z.string().uuid(),
});
export type AttachTagToLessonRequest = z.infer<typeof attachTagToLessonRequestSchema>;

/**
 * レッスンに付与されたタグ一覧応答。件数が少ないためカーソルページネーションは行わない
 * （プロジェクトタスク一覧 projectTaskListResponseSchema と同様の方針）。
 */
export const lessonTagListResponseSchema = z.object({
  items: z.array(tagResponseSchema),
});
export type LessonTagListResponse = z.infer<typeof lessonTagListResponseSchema>;
