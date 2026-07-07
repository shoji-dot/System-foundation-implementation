import { z } from "zod";

import { userResponseSchema } from "./auth";
import { planSchema, systemRoleSchema } from "./roles";

/**
 * GET /api/v1/admin/users クエリ（カーソルページネーション、他一覧APIと同様の方式）。
 */
export const listUsersQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

/**
 * ユーザー一覧応答（設計書⑫ S21「ユーザー管理」）。個々の要素は GET /me と同じ
 * userResponseSchema（passwordHashを含まない公開情報）を再利用する。
 */
export const userListResponseSchema = z.object({
  items: z.array(userResponseSchema),
  nextCursor: z.string().nullable(),
});
export type UserListResponse = z.infer<typeof userListResponseSchema>;

/**
 * ユーザーIDパラメータ（PATCH /api/v1/admin/users/:id/role・/plan 共通）。
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type UserIdParam = z.infer<typeof userIdParamSchema>;

/**
 * PATCH /api/v1/admin/users/:id/role リクエストボディ（設計書⑦ システムロール変更）。
 */
export const updateUserRoleRequestSchema = z.object({
  systemRole: systemRoleSchema,
});
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;

/**
 * PATCH /api/v1/admin/users/:id/plan リクエストボディ（設計書⑦ 課金プラン変更）。
 */
export const updateUserPlanRequestSchema = z.object({
  plan: planSchema,
});
export type UpdateUserPlanRequest = z.infer<typeof updateUserPlanRequestSchema>;
