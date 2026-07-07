import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PROJECT_TASK_REPOSITORY } from "../../core/domain/project-task.repository";
import { PROJECT_REPOSITORY } from "../../core/domain/project.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { CreateProjectTaskUsecase } from "../../core/usecases/create-project-task.usecase";
import { CreateProjectUsecase } from "../../core/usecases/create-project.usecase";
import { GetProjectDetailUsecase } from "../../core/usecases/get-project-detail.usecase";
import { ListProjectTasksUsecase } from "../../core/usecases/list-project-tasks.usecase";
import { ListProjectsUsecase } from "../../core/usecases/list-projects.usecase";
import { UpdateProjectTaskStatusUsecase } from "../../core/usecases/update-project-task-status.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaProjectTaskRepository } from "../../infrastructure/database/repositories/prisma-project-task.repository";
import { PrismaProjectRepository } from "../../infrastructure/database/repositories/prisma-project.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { ProjectsController } from "./projects.controller";

/**
 * 実務支援プロジェクトモジュール（設計書③ modules/projects、⑤ GET/POST /api/v1/projects、
 * /projects/:id/tasks、S15/S16、S04）。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ProjectsController],
  providers: [
    ListProjectsUsecase,
    CreateProjectUsecase,
    GetProjectDetailUsecase,
    ListProjectTasksUsecase,
    CreateProjectTaskUsecase,
    UpdateProjectTaskStatusUsecase,
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
    { provide: PROJECT_TASK_REPOSITORY, useClass: PrismaProjectTaskRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class ProjectsModule {}
