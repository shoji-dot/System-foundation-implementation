import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { SystemRole, User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface UpdateUserRoleInput {
  id: string;
  systemRole: SystemRole;
}

/**
 * ユーザーのシステムロール変更ユースケース（設計書⑫ S21「ユーザー管理」、⑦ RBAC、ADMIN限定）。
 */
@Injectable()
export class UpdateUserRoleUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserRoleInput): Promise<User> {
    const existing = await this.userRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException("指定されたユーザーが見つかりません。");
    }

    return this.userRepository.updateRole(input.id, input.systemRole);
  }
}
