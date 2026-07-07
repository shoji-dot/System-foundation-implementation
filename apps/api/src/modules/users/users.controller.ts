import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import type { UserResponse } from "@yakuji/shared";
import { userResponseSchema } from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CompleteOnboardingUsecase } from "../../core/usecases/complete-onboarding.usecase";
import { GetCurrentUserUsecase } from "../../core/usecases/get-current-user.usecase";

import { CompleteOnboardingRequestDto } from "./dto/complete-onboarding-request.dto";

/**
 * 設計書⑤ GET /api/v1/me、③ modules/users（ユーザー情報）。
 * PATCH /api/v1/me/onboarding は設計書⑤に明記は無いが、S03「オンボーディング」完了（設計書⑫）を
 * 実現するためユーザー承認済みで追加。
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUserUsecase: GetCurrentUserUsecase,
    private readonly completeOnboardingUsecase: CompleteOnboardingUsecase,
  ) {}

  @Get("me")
  async me(@Req() request: AuthenticatedRequest): Promise<UserResponse> {
    const user = await this.getCurrentUserUsecase.execute(request.user.userId);

    return userResponseSchema.parse({
      ...user,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  }

  @Patch("me/onboarding")
  async completeOnboarding(
    @Req() request: AuthenticatedRequest,
    @Body() body: CompleteOnboardingRequestDto,
  ): Promise<UserResponse> {
    const user = await this.completeOnboardingUsecase.execute({
      id: request.user.userId,
      profession: body.profession,
      interestedJurisdictions: body.interestedJurisdictions,
    });

    return userResponseSchema.parse({
      ...user,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  }
}
