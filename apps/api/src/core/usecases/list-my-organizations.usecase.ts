import { Inject, Injectable } from "@nestjs/common";

import type { OrganizationMembership } from "../domain/membership.entity";
import type { MembershipRepository } from "../domain/membership.repository";
import { MEMBERSHIP_REPOSITORY } from "../domain/membership.repository";

/**
 * S19「アカウント設定・組織」所属組織一覧取得ユースケース（設計書⑫、設計書⑤に明記は無いが
 * S19の組織セクション表示に必要なためユーザー承認済みで追加。表示のみで作成・招待は対象外）。
 */
@Injectable()
export class ListMyOrganizationsUsecase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(userId: string): Promise<OrganizationMembership[]> {
    return this.membershipRepository.findManyForUser(userId);
  }
}
