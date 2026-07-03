import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { UserResponse } from "@yakuji/shared";
import { userResponseSchema } from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetCurrentUserUsecase } from "../../core/usecases/get-current-user.usecase";

/**
 * 設計書⑤ GET /api/v1/me、③ modules/users（ユーザー情報）。
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly getCurrentUserUsecase: GetCurrentUserUsecase) {}

  @Get("me")
  async me(@Req() request: AuthenticatedRequest): Promise<UserResponse> {
    const user = await this.getCurrentUserUsecase.execute(request.user.userId);

    return userResponseSchema.parse({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  }
}
