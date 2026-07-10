import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { JURISDICTION_REPOSITORY } from "../../core/domain/jurisdiction.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../../core/domain/lifecycle-template.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { CreateLifecycleTemplateUsecase } from "../../core/usecases/create-lifecycle-template.usecase";
import { DeleteLifecycleTemplateUsecase } from "../../core/usecases/delete-lifecycle-template.usecase";
import { GetAdminLifecycleTemplateDetailUsecase } from "../../core/usecases/get-admin-lifecycle-template-detail.usecase";
import { GetLifecycleTemplateDetailUsecase } from "../../core/usecases/get-lifecycle-template-detail.usecase";
import { ListAdminLifecycleTemplatesUsecase } from "../../core/usecases/list-admin-lifecycle-templates.usecase";
import { ListLifecycleTemplatesUsecase } from "../../core/usecases/list-lifecycle-templates.usecase";
import { PublishLifecycleTemplateUsecase } from "../../core/usecases/publish-lifecycle-template.usecase";
import { UpdateLifecycleTemplateUsecase } from "../../core/usecases/update-lifecycle-template.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaJurisdictionRepository } from "../../infrastructure/database/repositories/prisma-jurisdiction.repository";
import { PrismaLifecycleTemplateRepository } from "../../infrastructure/database/repositories/prisma-lifecycle-template.repository";
import { LifecyclePhaseSeeder } from "../../infrastructure/database/seeders/lifecycle-phase.seeder";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { AdminLifecycleTemplatesController } from "./admin-lifecycle-templates.controller";
import { LifecycleController } from "./lifecycle.controller";

/**
 * 工程マスタモジュール（設計変更書③ modules/lifecycle）。
 * 公開閲覧(GET /lifecycle/templates系、Phase7 7-2 PR②)と管理CRUD+publish
 * (CRUD /admin/lifecycle-templates、admin/editor限定、7-2 PR③)を同一モジュールに集約する
 * （ingestionモジュールがworkflowと分かれているのとは異なり、対象エンティティが同一のため分割しない）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [LifecycleController, AdminLifecycleTemplatesController],
  providers: [
    ListLifecycleTemplatesUsecase,
    GetLifecycleTemplateDetailUsecase,
    CreateLifecycleTemplateUsecase,
    UpdateLifecycleTemplateUsecase,
    DeleteLifecycleTemplateUsecase,
    PublishLifecycleTemplateUsecase,
    ListAdminLifecycleTemplatesUsecase,
    GetAdminLifecycleTemplateDetailUsecase,
    LifecyclePhaseSeeder,
    { provide: LIFECYCLE_TEMPLATE_REPOSITORY, useClass: PrismaLifecycleTemplateRepository },
    { provide: JURISDICTION_REPOSITORY, useClass: PrismaJurisdictionRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class LifecycleModule {}
