import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { TAG_REPOSITORY } from "../../core/domain/tag.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { CreateTagUsecase } from "../../core/usecases/create-tag.usecase";
import { DeleteTagUsecase } from "../../core/usecases/delete-tag.usecase";
import { ListTagsUsecase } from "../../core/usecases/list-tags.usecase";
import { UpdateTagUsecase } from "../../core/usecases/update-tag.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaTagRepository } from "../../infrastructure/database/repositories/prisma-tag.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { TagsController } from "./tags.controller";

/**
 * タグ管理モジュール（設計書③ modules、⑫ S21「管理: コンテンツ管理」のうちタグ管理部分）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [TagsController],
  providers: [
    ListTagsUsecase,
    CreateTagUsecase,
    UpdateTagUsecase,
    DeleteTagUsecase,
    { provide: TAG_REPOSITORY, useClass: PrismaTagRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class TagsModule {}
