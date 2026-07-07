import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { Profession, PublicUser } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface CompleteOnboardingInput {
  id: string;
  profession: Profession;
  interestedJurisdictions: JurisdictionCode[];
}

/**
 * S03「オンボーディング（職能・関心国選択）」完了ユースケース（設計書⑫、設計書⑤に明記は無いが
 * S01-S02-S03-S04の画面遷移（設計書⑬）を実現するためユーザー承認済みで追加）。
 * update-user-role/update-user-plan usecase と同様、対象ユーザーの存在確認後にリポジトリへ委譲する。
 */
@Injectable()
export class CompleteOnboardingUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(input: CompleteOnboardingInput): Promise<PublicUser> {
    const existing = await this.userRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException("ユーザーが見つかりません。");
    }

    const user = await this.userRepository.completeOnboarding(input.id, {
      profession: input.profession,
      interestedJurisdictions: input.interestedJurisdictions,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      systemRole: user.systemRole,
      plan: user.plan,
      profession: user.profession,
      interestedJurisdictions: user.interestedJurisdictions,
      onboardingCompletedAt: user.onboardingCompletedAt,
      createdAt: user.createdAt,
    };
  }
}
