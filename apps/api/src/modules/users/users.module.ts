import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { USER_REPOSITORY } from "../../core/domain/user.repository";
import { GetCurrentUserUsecase } from "../../core/usecases/get-current-user.usecase";
import { ListUsersUsecase } from "../../core/usecases/list-users.usecase";
import { UpdateUserPlanUsecase } from "../../core/usecases/update-user-plan.usecase";
import { UpdateUserRoleUsecase } from "../../core/usecases/update-user-role.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { AdminUsersController } from "./admin-users.controller";
import { UsersController } from "./users.controller";

/**
 * ユーザーモジュール。GET /me（UsersController）に加え、設計書⑫ S21「ユーザー管理」
 * （一覧・ロール変更・プラン変更、ADMIN限定）の AdminUsersController も自己完結で co-locate する
 * （learningモジュールの courses/admin-courses と同様の方針）。
 */
@Module({
  // JwtAuthGuardが使うTOKEN_SERVICE(JwtTokenService)にはJwtServiceが必要なため、
  // authモジュールと同様にJwtModuleをここでもimportする（モジュールごとに自己完結させる方針）。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [UsersController, AdminUsersController],
  providers: [
    GetCurrentUserUsecase,
    ListUsersUsecase,
    UpdateUserRoleUsecase,
    UpdateUserPlanUsecase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class UsersModule {}
