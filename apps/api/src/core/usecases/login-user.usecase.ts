import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";

import type { PasswordHasher } from "../domain/password-hasher";
import { PASSWORD_HASHER } from "../domain/password-hasher";
import type { IssuedTokenPair, TokenService } from "../domain/token-service";
import { TOKEN_SERVICE } from "../domain/token-service";
import type { UserRepository } from "../domain/user.repository";
import { USER_REPOSITORY } from "../domain/user.repository";

export interface LoginUserInput {
  email: string;
  password: string;
}

const INVALID_CREDENTIALS_MESSAGE = "メールアドレスまたはパスワードが正しくありません。";

/**
 * ログイン（JWT発行）ユースケース（設計書⑤ POST /api/v1/auth/login、⑦ JWT方式）。
 */
@Injectable()
export class LoginUserUsecase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<IssuedTokenPair> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    // アカウント不存在・OAuthのみ登録(passwordHash=null)のいずれも同一エラーにする
    // （アカウント有無や認証方式をレスポンス差異から推測されないようにするため。列挙攻撃対策）。
    if (!user || !user.passwordHash) {
      await this.passwordHasher.hash(input.password); // タイミング攻撃対策のダミー処理
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const isValid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.tokenService.issueTokenPair({
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      plan: user.plan,
    });
  }
}
