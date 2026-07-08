import type { OrganizationMembership } from "./membership.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaMembershipRepository）。
 */
export const MEMBERSHIP_REPOSITORY = Symbol("MEMBERSHIP_REPOSITORY");

export interface MembershipRepository {
  /**
   * GET /api/v1/me/organizations（設計書⑫ S19「組織」表示）。ログイン中のユーザー自身が所属する
   * 組織を作成順で返す。組織の作成・招待・メンバー管理は対象外（表示のみ、ユーザー承認済み）。
   */
  findManyForUser(userId: string): Promise<OrganizationMembership[]>;
}
