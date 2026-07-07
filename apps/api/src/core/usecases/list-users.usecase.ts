import { Inject, Injectable } from "@nestjs/common";

import type { ListUsersFilters, UserListResult, UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

/**
 * ユーザー一覧取得ユースケース（設計書⑫ S21「ユーザー管理」、ADMIN限定）。
 */
@Injectable()
export class ListUsersUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(input: ListUsersFilters): Promise<UserListResult> {
    return this.userRepository.list(input);
  }
}
