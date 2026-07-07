import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { NOTIFICATION_REPOSITORY } from "../../core/domain/notification.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { UPDATE_FEED_REPOSITORY } from "../../core/domain/update-feed.repository";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../../core/domain/update-subscription.repository";
import { CreateUpdateSubscriptionUsecase } from "../../core/usecases/create-update-subscription.usecase";
import { DeleteSubscriptionUsecase } from "../../core/usecases/delete-subscription.usecase";
import { ListNotificationsUsecase } from "../../core/usecases/list-notifications.usecase";
import { ListSubscriptionsUsecase } from "../../core/usecases/list-subscriptions.usecase";
import { ListUpdatesUsecase } from "../../core/usecases/list-updates.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaNotificationRepository } from "../../infrastructure/database/repositories/prisma-notification.repository";
import { PrismaUpdateFeedRepository } from "../../infrastructure/database/repositories/prisma-update-feed.repository";
import { PrismaUpdateSubscriptionRepository } from "../../infrastructure/database/repositories/prisma-update-subscription.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { NotificationsController } from "./notifications.controller";
import { SubscriptionsController } from "./subscriptions.controller";
import { UpdatesController } from "./updates.controller";

/**
 * 更新通知モジュール（設計書③ modules/notifications、⑤ updates/subscriptions系API、S04/S17/S18）。
 * 通知一覧API(GET /api/v1/notifications)、購読一覧・解除API(GET/DELETE /api/v1/subscriptions)は
 * 設計書⑤に明記は無いが、⑨の通知生成・S18「既存購読の一覧・解除」と対で必要なためユーザー承認済みで追加。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [UpdatesController, SubscriptionsController, NotificationsController],
  providers: [
    ListUpdatesUsecase,
    CreateUpdateSubscriptionUsecase,
    ListSubscriptionsUsecase,
    DeleteSubscriptionUsecase,
    ListNotificationsUsecase,
    { provide: UPDATE_FEED_REPOSITORY, useClass: PrismaUpdateFeedRepository },
    { provide: UPDATE_SUBSCRIPTION_REPOSITORY, useClass: PrismaUpdateSubscriptionRepository },
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class NotificationsModule {}
