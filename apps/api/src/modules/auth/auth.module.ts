import { Module } from "@nestjs/common";

import { PASSWORD_HASHER } from "../../core/domain/password-hasher";
import { USER_REPOSITORY } from "../../core/domain/user.repository";
import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository";
import { BcryptPasswordHasher } from "../../infrastructure/security/bcrypt-password-hasher";

import { AuthController } from "./auth.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    SignupUserUsecase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  ],
})
export class AuthModule {}
