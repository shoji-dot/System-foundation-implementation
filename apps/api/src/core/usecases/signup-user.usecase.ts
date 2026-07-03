import { ConflictException, Inject, Injectable } from "@nestjs/common";

import type { PasswordHasher } from "../domain/password-hasher";
import { PASSWORD_HASHER } from "../domain/password-hasher";
import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface SignupUserInput {
  email: string;
  password: string;
  name: string;
}

export type SignupUserResult = Pick<
  User,
  "id" | "email" | "name" | "locale" | "systemRole" | "plan" | "createdAt"
>;

/**
 * サインアップ（アカウント作成）ユースケース（設計書⑤ POST /api/v1/auth/signup）。
 * JWT発行は行わない（ログインは別ユースケース、設計書⑤で signup/login は別エンドポイント）。
 */
@Injectable()
export class SignupUserUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: SignupUserInput): Promise<SignupUserResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException("このメールアドレスは既に登録されています。");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      name: input.name.trim(),
    });

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
