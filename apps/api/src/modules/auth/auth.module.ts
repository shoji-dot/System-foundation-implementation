import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PASSWORD_HASHER } from "../../core/domain/password-hasher";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { USER_REPOSITORY } from "../../core/domain/user.repository";
import { LoginUserUsecase } from "../../core/usecases/login-user.usecase";
import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository";
import { BcryptPasswordHasher } from "../../infrastructure/security/bcrypt-password-hasher";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { AuthController } from "./auth.controller";

@Module({
  // JwtModule.register({}): secret/expiresIn は JwtTokenService 側で呼び出しごとに指定する
  // （access/refreshで別鍵を使うため、モジュール単位の単一secretは使わない）。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    SignupUserUsecase,
    LoginUserUsecase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class AuthModule {}
