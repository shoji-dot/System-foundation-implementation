import { z } from "zod";

import { cursorPaginationQuerySchema } from "./schemas";

/**
 * GET /api/v1/notifications クエリ（設計書⑨「published時: 購読ユーザーへ通知」準拠、S17）。
 * 設計書⑤の主要エンドポイント一覧に明記は無いが、通知生成(⑨)と対で必要なためユーザー承認済みで追加する。
 * 既読/未読の絞り込み・切替は今回のスコープ外（次回検討）。
 */
export const listNotificationsQuerySchema = cursorPaginationQuerySchema;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

/**
 * 通知応答（設計書④に列定義は無いが、ユーザー承認済みで追加したnotificationsテーブル準拠）。
 */
export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  regulationVersionId: z.string().uuid(),
  title: z.string(),
  body: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

/**
 * カーソルページネーション応答（通知一覧、GET /api/v1/notifications）。
 */
export const notificationListResponseSchema = z.object({
  items: z.array(notificationResponseSchema),
  nextCursor: z.string().nullable(),
});
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
