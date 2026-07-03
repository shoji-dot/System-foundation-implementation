import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";

import type { PublicUser } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

/**
 * GET /api/v1/me（設計書⑤）。JWTのclaimsではなくDBの最新値を返す
 * （名前変更等がaccess token有効期限内でも即時反映されるようにするため）。
 */
@Injectable()
export class GetCurrentUserUsecase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException("ユーザーが見つかりません。再度ログインしてください。");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      systemRole: user.systemRole,
      plan: user.plan,
      createdAt: user.createdAt,
    };
  }
}
