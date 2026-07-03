import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { USER_REPOSITORY } from "../../core/domain/user.repository";
import { GetCurrentUserUsecase } from "../../core/usecases/get-current-user.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { UsersController } from "./users.controller";

@Module({
  // JwtAuthGuardが使うTOKEN_SERVICE(JwtTokenService)にはJwtServiceが必要なため、
  // authモジュールと同様にJwtModuleをここでもimportする（モジュールごとに自己完結させる方針）。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [
    GetCurrentUserUsecase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class UsersModule {}
