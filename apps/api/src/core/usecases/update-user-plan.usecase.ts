import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Plan, User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface UpdateUserPlanInput {
  id: string;
  plan: Plan;
}

/**
 * ユーザーの課金プラン変更ユースケース（設計書⑫ S21「ユーザー管理」、⑦ エンタイトルメント層、ADMIN限定）。
 */
@Injectable()
export class UpdateUserPlanUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserPlanInput): Promise<User> {
    const existing = await this.userRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException("指定されたユーザーが見つかりません。");
    }

    return this.userRepository.updatePlan(input.id, input.plan);
  }
}
