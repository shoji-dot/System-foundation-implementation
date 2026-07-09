import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import type { BillingSubscriptionResponse } from "@yakuji/shared";
import { billingSubscriptionResponseSchema } from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { BillingSubscription } from "../../core/domain/billing-subscription.entity";
import { GrantComplimentarySubscriptionUsecase } from "../../core/usecases/grant-complimentary-subscription.usecase";
import { RevokeComplimentarySubscriptionUsecase } from "../../core/usecases/revoke-complimentary-subscription.usecase";

import { AdminSubscriptionUserIdParamDto } from "./dto/admin-subscription-user-id-param.dto";
import { GrantComplimentarySubscriptionRequestDto } from "./dto/grant-complimentary-subscription-request.dto";

/**
 * 設計変更書_ライフサイクル管理_SaaS化.md ⑥「社内利用（無償フル機能）」（Phase7 7-1 PR④、ADMIN限定）。
 * Stripeを通さずSubscription(source=COMPLIMENTARY)を付与・失効する（社内ドッグフーディングの前提条件）。
 * admin-users.controller（同じくADMIN限定のユーザー管理系）と同じ co-location 方針で
 * billingモジュール配下に自己完結させる。
 */
@Controller("admin/subscriptions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminSubscriptionsController {
  constructor(
    private readonly grantComplimentarySubscriptionUsecase: GrantComplimentarySubscriptionUsecase,
    private readonly revokeComplimentarySubscriptionUsecase: RevokeComplimentarySubscriptionUsecase,
  ) {}

  @Put(":id/complimentary")
  async grant(
    @Param() params: AdminSubscriptionUserIdParamDto,
    @Body() body: GrantComplimentarySubscriptionRequestDto,
  ): Promise<BillingSubscriptionResponse> {
    const subscription = await this.grantComplimentarySubscriptionUsecase.execute({
      userId: params.id,
      organizationId: body.organizationId,
      plan: body.plan,
    });

    return billingSubscriptionResponseSchema.parse(toResponse(subscription));
  }

  @Delete(":id/complimentary")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param() params: AdminSubscriptionUserIdParamDto): Promise<void> {
    await this.revokeComplimentarySubscriptionUsecase.execute({ userId: params.id });
  }
}

function toResponse(subscription: BillingSubscription) {
  return {
    id: subscription.id,
    userId: subscription.userId,
    organizationId: subscription.organizationId,
    plan: subscription.plan,
    status: subscription.status,
    source: subscription.source,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    seats: subscription.seats,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  };
}
