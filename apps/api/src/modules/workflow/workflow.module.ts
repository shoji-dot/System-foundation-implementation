import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { NOTIFICATION_REPOSITORY } from "../../core/domain/notification.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../../core/domain/regulation-ingestion.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../../core/domain/update-subscription.repository";
import { GetPendingReviewVersionDetailUsecase } from "../../core/usecases/get-pending-review-version-detail.usecase";
import { ListPendingReviewVersionsUsecase } from "../../core/usecases/list-pending-review-versions.usecase";
import { PublishRegulationVersionUsecase } from "../../core/usecases/publish-regulation-version.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaNotificationRepository } from "../../infrastructure/database/repositories/prisma-notification.repository";
import { PrismaRegulationIngestionRepository } from "../../infrastructure/database/repositories/prisma-regulation-ingestion.repository";
import { PrismaUpdateSubscriptionRepository } from "../../infrastructure/database/repositories/prisma-update-subscription.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { IngestionReviewController } from "./ingestion-review.controller";

/**
 * 編集ワークフローモジュール（設計書③ modules/workflow、⑫ S20 管理: 取込レビュー）。
 * HTTP API側（apps/api本体）に組み込む。取込パイプライン自体（ingestion.module.ts）はWorker専用のまま。
 * 公開(publish)時のアプリ内通知生成（設計書⑨）のため、UpdateSubscription/Notificationリポジトリも
 * このモジュールに提供する（PublishRegulationVersionUsecaseが必要とするため）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [IngestionReviewController],
  providers: [
    ListPendingReviewVersionsUsecase,
    GetPendingReviewVersionDetailUsecase,
    PublishRegulationVersionUsecase,
    { provide: REGULATION_INGESTION_REPOSITORY, useClass: PrismaRegulationIngestionRepository },
    { provide: UPDATE_SUBSCRIPTION_REPOSITORY, useClass: PrismaUpdateSubscriptionRepository },
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class WorkflowModule {}
