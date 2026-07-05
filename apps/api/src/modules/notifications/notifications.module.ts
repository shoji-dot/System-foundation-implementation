import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { UPDATE_FEED_REPOSITORY } from "../../core/domain/update-feed.repository";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../../core/domain/update-subscription.repository";
import { CreateUpdateSubscriptionUsecase } from "../../core/usecases/create-update-subscription.usecase";
import { ListUpdatesUsecase } from "../../core/usecases/list-updates.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaUpdateFeedRepository } from "../../infrastructure/database/repositories/prisma-update-feed.repository";
import { PrismaUpdateSubscriptionRepository } from "../../infrastructure/database/repositories/prisma-update-subscription.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { SubscriptionsController } from "./subscriptions.controller";
import { UpdatesController } from "./updates.controller";

/**
 * 更新通知モジュール（設計書③ modules/notifications、⑤ updates/subscriptions系API、S04/S17/S18）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [UpdatesController, SubscriptionsController],
  providers: [
    ListUpdatesUsecase,
    CreateUpdateSubscriptionUsecase,
    { provide: UPDATE_FEED_REPOSITORY, useClass: PrismaUpdateFeedRepository },
    { provide: UPDATE_SUBSCRIPTION_REPOSITORY, useClass: PrismaUpdateSubscriptionRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class NotificationsModule {}
