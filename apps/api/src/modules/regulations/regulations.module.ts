import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { JURISDICTION_REPOSITORY } from "../../core/domain/jurisdiction.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { ListJurisdictionsUsecase } from "../../core/usecases/list-jurisdictions.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaJurisdictionRepository } from "../../infrastructure/database/repositories/prisma-jurisdiction.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { JurisdictionsController } from "./jurisdictions.controller";

/**
 * 法規制データ閲覧モジュール（設計書③ modules/regulations、⑤ jurisdictions/regulations系API）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [JurisdictionsController],
  providers: [
    ListJurisdictionsUsecase,
    { provide: JURISDICTION_REPOSITORY, useClass: PrismaJurisdictionRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class RegulationsModule {}
