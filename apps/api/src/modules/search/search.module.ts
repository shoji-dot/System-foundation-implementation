import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { SEARCH_REPOSITORY } from "../../core/domain/search.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { SearchUsecase } from "../../core/usecases/search.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaSearchRepository } from "../../infrastructure/database/repositories/prisma-search.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { SearchController } from "./search.controller";

/**
 * 統合検索モジュール（設計書③ modules/search、⑤⑩ search系API、S05）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [SearchController],
  providers: [
    SearchUsecase,
    { provide: SEARCH_REPOSITORY, useClass: PrismaSearchRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class SearchModule {}
