import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { UserListResponse, UserResponse } from "@yakuji/shared";
import { userListResponseSchema, userResponseSchema } from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { User } from "../../core/domain/user.entity";
import { ListUsersUsecase } from "../../core/usecases/list-users.usecase";
import { UpdateUserPlanUsecase } from "../../core/usecases/update-user-plan.usecase";
import { UpdateUserRoleUsecase } from "../../core/usecases/update-user-role.usecase";

import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserPlanRequestDto } from "./dto/update-user-plan-request.dto";
import { UpdateUserRoleRequestDto } from "./dto/update-user-role-request.dto";
import { UserIdParamDto } from "./dto/user-id-param.dto";

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちユーザー管理部分（一覧・ロール変更・プラン変更）。
 * ロール/プラン変更はコンテンツ編集より機微度が高いため、他の管理系エンドポイント
 * （タグ/コース/レッスン管理、editor/admin）とは異なり ADMIN 限定とする（ユーザー承認済み）。
 */
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminUsersController {
  constructor(
    private readonly listUsersUsecase: ListUsersUsecase,
    private readonly updateUserRoleUsecase: UpdateUserRoleUsecase,
    private readonly updateUserPlanUsecase: UpdateUserPlanUsecase,
  ) {}

  @Get()
  async list(@Query() query: ListUsersQueryDto): Promise<UserListResponse> {
    const result = await this.listUsersUsecase.execute({
      cursor: query.cursor,
      limit: query.limit,
    });

    return userListResponseSchema.parse({
      items: result.items.map((user) => toResponse(user)),
      nextCursor: result.nextCursor,
    });
  }

  @Patch(":id/role")
  async updateRole(
    @Param() params: UserIdParamDto,
    @Body() body: UpdateUserRoleRequestDto,
  ): Promise<UserResponse> {
    const user = await this.updateUserRoleUsecase.execute({
      id: params.id,
      systemRole: body.systemRole,
    });

    return userResponseSchema.parse(toResponse(user));
  }

  @Patch(":id/plan")
  async updatePlan(
    @Param() params: UserIdParamDto,
    @Body() body: UpdateUserPlanRequestDto,
  ): Promise<UserResponse> {
    const user = await this.updateUserPlanUsecase.execute({
      id: params.id,
      plan: body.plan,
    });

    return userResponseSchema.parse(toResponse(user));
  }
}

function toResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    locale: user.locale,
    systemRole: user.systemRole,
    plan: user.plan,
    createdAt: user.createdAt.toISOString(),
  };
}
