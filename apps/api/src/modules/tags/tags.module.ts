import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { LESSON_REPOSITORY } from "../../core/domain/lesson.repository";
import { TAG_REPOSITORY } from "../../core/domain/tag.repository";
import { TAGGING_REPOSITORY } from "../../core/domain/tagging.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { AttachTagToLessonUsecase } from "../../core/usecases/attach-tag-to-lesson.usecase";
import { CreateTagUsecase } from "../../core/usecases/create-tag.usecase";
import { DeleteTagUsecase } from "../../core/usecases/delete-tag.usecase";
import { DetachTagFromLessonUsecase } from "../../core/usecases/detach-tag-from-lesson.usecase";
import { ListLessonTagsUsecase } from "../../core/usecases/list-lesson-tags.usecase";
import { ListTagsUsecase } from "../../core/usecases/list-tags.usecase";
import { UpdateTagUsecase } from "../../core/usecases/update-tag.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaLessonRepository } from "../../infrastructure/database/repositories/prisma-lesson.repository";
import { PrismaTagRepository } from "../../infrastructure/database/repositories/prisma-tag.repository";
import { PrismaTaggingRepository } from "../../infrastructure/database/repositories/prisma-tagging.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { LessonTagsController } from "./lesson-tags.controller";
import { TagsController } from "./tags.controller";

/**
 * タグ管理モジュール（設計書③ modules、⑫ S21「管理: コンテンツ管理」のうちタグ管理部分）。
 * レッスンへのタグ付与/解除（LessonTagsController）が LessonRepository を必要とするため、
 * learningモジュールとは独立に自己完結でPrismaLessonRepositoryを提供する
 * （他モジュール同様、モジュールごとに自己完結させる方針。LearningModule側は何もexportしていないため）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [TagsController, LessonTagsController],
  providers: [
    ListTagsUsecase,
    CreateTagUsecase,
    UpdateTagUsecase,
    DeleteTagUsecase,
    ListLessonTagsUsecase,
    AttachTagToLessonUsecase,
    DetachTagFromLessonUsecase,
    { provide: TAG_REPOSITORY, useClass: PrismaTagRepository },
    { provide: TAGGING_REPOSITORY, useClass: PrismaTaggingRepository },
    { provide: LESSON_REPOSITORY, useClass: PrismaLessonRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class TagsModule {}
