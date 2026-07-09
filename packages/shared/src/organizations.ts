import { z } from "zod";

/**
 * 組織種別（設計書④ organizations 準拠）。apps/api の OrganizationType と値を一致させる。
 */
export const ORGANIZATION_TYPES = ["MAKER", "MARKETING_HOLDER", "IMPORTER", "ACADEMIC"] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];
export const organizationTypeSchema = z.enum(ORGANIZATION_TYPES);

/**
 * 組織内ロール（設計書⑦ 準拠）。apps/api の OrgRole と値を一致させる。
 */
export const ORG_ROLES = ["ORG_ADMIN", "MEMBER"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];
export const orgRoleSchema = z.enum(ORG_ROLES);

/**
 * GET /api/v1/me/organizations 応答項目（設計書⑫ S19「組織」表示）。設計書⑤に明記は無いエンドポイント
 * だが、S19の組織セクション表示に必要なためユーザー承認済みで追加。組織の作成・招待・メンバー管理は
 * 設計書⑤のAPI一覧・他画面に定義が無いため本コミットのスコープ外（表示のみ、ユーザー承認済み）。
 */
export const organizationMembershipResponseSchema = z.object({
  organizationId: z.string().uuid(),
  organizationName: z.string(),
  organizationType: organizationTypeSchema,
  role: orgRoleSchema,
});
export type OrganizationMembershipResponse = z.infer<typeof organizationMembershipResponseSchema>;

/**
 * GET /api/v1/me/organizations 応答。件数が少ないためページネーションは行わない
 * （classification_mappings一覧と同様の判断）。
 */
export const myOrganizationsResponseSchema = z.object({
  items: z.array(organizationMembershipResponseSchema),
});
export type MyOrganizationsResponse = z.infer<typeof myOrganizationsResponseSchema>;
