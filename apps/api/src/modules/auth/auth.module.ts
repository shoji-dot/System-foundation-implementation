import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PASSWORD_HASHER } from "../../core/domain/password-hasher";
import { TOKEN_REVOCATION_STORE } from "../../core/domain/token-revocation-store";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { USER_REPOSITORY } from "../../core/domain/user.repository";
import { LoginUserUsecase } from "../../core/usecases/login-user.usecase";
import { LogoutUserUsecase } from "../../core/usecases/logout-user.usecase";
import { RefreshTokenUsecase } from "../../core/usecases/refresh-token.usecase";
import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository";
import { BcryptPasswordHasher } from "../../infrastructure/security/bcrypt-password-hasher";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { RedisTokenRevocationStore } from "../../infrastructure/security/redis-token-revocation-store";

import { AuthController } from "./auth.controller";

@Module({
  // JwtModule.register({}): secret/expiresIn は JwtTokenService 側で呼び出しごとに指定する
  // （access/refreshで別鍵を使うため、モジュール単位の単一secretは使わない）。
  // REDIS_CLIENT は RedisModule が @Global() のため明示importは不要（AppModuleで登録済み）。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    SignupUserUsecase,
    LoginUserUsecase,
    RefreshTokenUsecase,
    LogoutUserUsecase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: TOKEN_REVOCATION_STORE, useClass: RedisTokenRevocationStore },
  ],
})
export class AuthModule {}
