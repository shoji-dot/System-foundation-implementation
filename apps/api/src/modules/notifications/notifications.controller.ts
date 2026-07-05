import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { NotificationListResponse } from "@yakuji/shared";
import { notificationListResponseSchema } from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListNotificationsUsecase } from "../../core/usecases/list-notifications.usecase";

import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";

/**
 * GET /api/v1/notifications（設計書⑨「published時: 購読ユーザーへ通知」に対応する一覧取得API）。
 * 設計書⑤の主要エンドポイント一覧に明記は無いが、通知生成と対で必要なためユーザー承認済みで追加。
 * ログイン中のユーザー自身の通知のみを新着順で返す。
 */
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly listNotificationsUsecase: ListNotificationsUsecase) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationListResponse> {
    const result = await this.listNotificationsUsecase.execute({
      userId: request.user.userId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return notificationListResponseSchema.parse({
      items: result.items.map((item) => ({
        id: item.id,
        regulationVersionId: item.regulationVersionId,
        title: item.title,
        body: item.body,
        isRead: item.isRead,
        createdAt: item.createdAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    });
  }
}
