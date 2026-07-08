import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { SubscriptionListResponse, SubscriptionResponse } from "@yakuji/shared";
import { subscriptionListResponseSchema, subscriptionResponseSchema } from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateUpdateSubscriptionUsecase } from "../../core/usecases/create-update-subscription.usecase";
import { DeleteSubscriptionUsecase } from "../../core/usecases/delete-subscription.usecase";
import { ListSubscriptionsUsecase } from "../../core/usecases/list-subscriptions.usecase";

import { CreateSubscriptionRequestDto } from "./dto/create-subscription-request.dto";
import { SubscriptionIdParamDto } from "./dto/subscription-id-param.dto";

/**
 * 設計書⑤ POST /api/v1/subscriptions（更新通知購読、S17/S18）。
 * ログイン中のユーザー自身の購読として作成するため、userIdはbodyに含めずアクセストークンから取得する
 * （POST /api/v1/progressと同じ方針）。
 * GET一覧・DELETE解除は設計書⑤に明記は無いが、S18「既存購読の一覧・解除」向けにユーザー承認済みで追加。
 */
@Controller("subscriptions")
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly createUpdateSubscriptionUsecase: CreateUpdateSubscriptionUsecase,
    private readonly listSubscriptionsUsecase: ListSubscriptionsUsecase,
    private readonly deleteSubscriptionUsecase: DeleteSubscriptionUsecase,
  ) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest): Promise<SubscriptionListResponse> {
    const subscriptions = await this.listSubscriptionsUsecase.execute(request.user.userId);

    return subscriptionListResponseSchema.parse({
      items: subscriptions.map((subscription) => ({
        id: subscription.id,
        jurisdiction: subscription.jurisdiction,
        regulationType: subscription.regulationType,
        frequency: subscription.frequency,
        createdAt: subscription.createdAt.toISOString(),
      })),
    });
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponse> {
    const subscription = await this.createUpdateSubscriptionUsecase.execute({
      userId: request.user.userId,
      plan: request.user.plan,
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

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param() params: SubscriptionIdParamDto,
  ): Promise<void> {
    await this.deleteSubscriptionUsecase.execute({
      userId: request.user.userId,
      subscriptionId: params.id,
    });
  }
}
