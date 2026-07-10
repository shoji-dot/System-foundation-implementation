import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../../core/domain/lifecycle-template.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { GetLifecycleTemplateDetailUsecase } from "../../core/usecases/get-lifecycle-template-detail.usecase";
import { ListLifecycleTemplatesUsecase } from "../../core/usecases/list-lifecycle-templates.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaLifecycleTemplateRepository } from "../../infrastructure/database/repositories/prisma-lifecycle-template.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { LifecycleController } from "./lifecycle.controller";

/**
 * 工程マスタ閲覧モジュール（設計変更書③ modules/lifecycle、Phase7 7-2 PR②）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [LifecycleController],
  providers: [
    ListLifecycleTemplatesUsecase,
    GetLifecycleTemplateDetailUsecase,
    { provide: LIFECYCLE_TEMPLATE_REPOSITORY, useClass: PrismaLifecycleTemplateRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class LifecycleModule {}
