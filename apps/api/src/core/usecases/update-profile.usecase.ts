import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { Profession, PublicUser } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface UpdateProfileUsecaseInput {
  id: string;
  name: string;
  locale: string;
  profession: Profession;
  interestedJurisdictions: JurisdictionCode[];
}

/**
 * S19「アカウント設定・プロフィール」編集ユースケース（設計書⑫、設計書⑤に明記は無いが
 * オンボーディング後にプロフィールを編集する導線として必須のためユーザー承認済みで追加）。
 * complete-onboarding usecase と同様、対象ユーザーの存在確認後にリポジトリへ委譲する。
 */
@Injectable()
export class UpdateProfileUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(input: UpdateProfileUsecaseInput): Promise<PublicUser> {
    const existing = await this.userRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException("ユーザーが見つかりません。");
    }

    const user = await this.userRepository.updateProfile(input.id, {
      name: input.name,
      locale: input.locale,
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
