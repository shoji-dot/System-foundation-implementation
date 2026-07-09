import { z } from "zod";

import { userResponseSchema } from "./auth";
import { planSchema, professionSchema, systemRoleSchema } from "./roles";
import { jurisdictionCodeSchema } from "./schemas";

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

/**
 * ロケール（設計書④ users.locale 準拠）。UI文言のi18n切替は未実装だが、列自体は設計書に明記されて
 * いるためS19プロフィール編集で許可値をja/enに制限する（将来のi18n対応時に流用、ユーザー承認済み）。
 */
export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const localeSchema = z.enum(LOCALES);

/**
 * PATCH /api/v1/me/profile リクエストボディ（設計書⑫ S19「アカウント設定・プロフィール」向け。
 * 設計書⑤に明記は無いが、オンボーディング後にプロフィールを編集する導線として必須のためユーザー承認済みで
 * 追加。profession/interestedJurisdictionsの検証ルールはcompleteOnboardingRequestSchemaと同一とする。
 */
export const updateProfileRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  locale: localeSchema,
  profession: professionSchema,
  interestedJurisdictions: z.array(jurisdictionCodeSchema).min(1).max(10),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
