import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { SubscriptionResponse } from "@yakuji/shared";
import { subscriptionResponseSchema } from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateUpdateSubscriptionUsecase } from "../../core/usecases/create-update-subscription.usecase";

import { CreateSubscriptionRequestDto } from "./dto/create-subscription-request.dto";

/**
 * 設計書⑤ POST /api/v1/subscriptions（更新通知購読、S17/S18）。
 * ログイン中のユーザー自身の購読として作成するため、userIdはbodyに含めずアクセストークンから取得する
 * （POST /api/v1/progressと同じ方針）。
 */
@Controller("subscriptions")
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly createUpdateSubscriptionUsecase: CreateUpdateSubscriptionUsecase) {}

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponse> {
    const subscription = await this.createUpdateSubscriptionUsecase.execute({
      userId: request.user.userId,
      jurisdiction: body.jurisdiction,
      regulationType: body.regulationType,
      frequency: body.frequency,
    });

    return subscriptionResponseSchema.parse({
      id: subscription.id,
      jurisdiction: subscription.jurisdiction,
      regulationType: subscription.regulationType,
      frequency: subscription.frequency,
      createdAt: subscription.createdAt.toISOString(),
    });
  }
}
