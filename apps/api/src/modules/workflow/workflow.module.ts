import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { REGULATION_INGESTION_REPOSITORY } from "../../core/domain/regulation-ingestion.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { GetPendingReviewVersionDetailUsecase } from "../../core/usecases/get-pending-review-version-detail.usecase";
import { ListPendingReviewVersionsUsecase } from "../../core/usecases/list-pending-review-versions.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaRegulationIngestionRepository } from "../../infrastructure/database/repositories/prisma-regulation-ingestion.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { IngestionReviewController } from "./ingestion-review.controller";

/**
 * 編集ワークフローモジュール（設計書③ modules/workflow、⑫ S20 管理: 取込レビュー）。
 * HTTP API側（apps/api本体）に組み込む。取込パイプライン自体（ingestion.module.ts）はWorker専用のまま。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [IngestionReviewController],
  providers: [
    ListPendingReviewVersionsUsecase,
    GetPendingReviewVersionDetailUsecase,
    { provide: REGULATION_INGESTION_REPOSITORY, useClass: PrismaRegulationIngestionRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class WorkflowModule {}
