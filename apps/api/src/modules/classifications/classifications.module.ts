import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { CLASSIFICATION_REPOSITORY } from "../../core/domain/classification.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { GetClassificationMappingsUsecase } from "../../core/usecases/get-classification-mappings.usecase";
import { ListClassificationsUsecase } from "../../core/usecases/list-classifications.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaClassificationRepository } from "../../infrastructure/database/repositories/prisma-classification.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { ClassificationsController } from "./classifications.controller";

/**
 * JMDN検索モジュール（設計書③ modules/classifications、⑤ classifications系API、S08/S09）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ClassificationsController],
  providers: [
    ListClassificationsUsecase,
    GetClassificationMappingsUsecase,
    { provide: CLASSIFICATION_REPOSITORY, useClass: PrismaClassificationRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class ClassificationsModule {}
