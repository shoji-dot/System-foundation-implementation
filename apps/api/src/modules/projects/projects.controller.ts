import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type {
  ProjectListResponse,
  ProjectResponse,
  ProjectRoadmapResponse,
  ProjectRoadmapStepResponse,
  ProjectTaskListResponse,
  ProjectTaskResponse,
} from "@yakuji/shared";
import {
  projectListResponseSchema,
  projectResponseSchema,
  projectRoadmapResponseSchema,
  projectRoadmapStepResponseSchema,
  projectTaskListResponseSchema,
  projectTaskResponseSchema,
} from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import type { ProjectRoadmapStepDetail } from "../../core/domain/project-roadmap.entity";
import { CreateProjectTaskUsecase } from "../../core/usecases/create-project-task.usecase";
import { CreateProjectUsecase } from "../../core/usecases/create-project.usecase";
import { GenerateProjectRoadmapUsecase } from "../../core/usecases/generate-project-roadmap.usecase";
import { GetProjectDetailUsecase } from "../../core/usecases/get-project-detail.usecase";
import { GetProjectRoadmapUsecase } from "../../core/usecases/get-project-roadmap.usecase";
import { ListProjectTasksUsecase } from "../../core/usecases/list-project-tasks.usecase";
import { ListProjectsUsecase } from "../../core/usecases/list-projects.usecase";
import { UpdateProjectRoadmapStepUsecase } from "../../core/usecases/update-project-roadmap-step.usecase";
import { UpdateProjectTaskStatusUsecase } from "../../core/usecases/update-project-task-status.usecase";

import { CreateProjectRequestDto } from "./dto/create-project-request.dto";
import { CreateProjectTaskRequestDto } from "./dto/create-project-task-request.dto";
import { GenerateProjectRoadmapRequestDto } from "./dto/generate-project-roadmap-request.dto";
import { ListProjectsQueryDto } from "./dto/list-projects-query.dto";
import { ProjectIdParamDto } from "./dto/project-id-param.dto";
import { ProjectRoadmapStepIdParamDto } from "./dto/project-roadmap-step-id-param.dto";
import { ProjectTaskIdParamDto } from "./dto/project-task-id-param.dto";
import { UpdateProjectRoadmapStepRequestDto } from "./dto/update-project-roadmap-step-request.dto";
import { UpdateProjectTaskStatusRequestDto } from "./dto/update-project-task-status-request.dto";

/**
 * 設計書⑤ GET/POST /api/v1/projects、/projects/:id/tasks（実務支援、S15/S16、S04「プロジェクト概況」）。
 * ログイン中のユーザー自身が所有するプロジェクトのみを対象とする（userIdはbodyに含めずアクセストークンから取得、
 * POST /api/v1/progress等と同じ方針）。
 * GET /projects/:id は設計書⑤に明記は無いがS16「プロジェクト詳細」表示に必要なためユーザー承認済みで追加。
 */
@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly listProjectsUsecase: ListProjectsUsecase,
    private readonly createProjectUsecase: CreateProjectUsecase,
    private readonly getProjectDetailUsecase: GetProjectDetailUsecase,
    private readonly listProjectTasksUsecase: ListProjectTasksUsecase,
    private readonly createProjectTaskUsecase: CreateProjectTaskUsecase,
    private readonly updateProjectTaskStatusUsecase: UpdateProjectTaskStatusUsecase,
    private readonly generateProjectRoadmapUsecase: GenerateProjectRoadmapUsecase,
    private readonly getProjectRoadmapUsecase: GetProjectRoadmapUsecase,
    private readonly updateProjectRoadmapStepUsecase: UpdateProjectRoadmapStepUsecase,
  ) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListProjectsQueryDto,
  ): Promise<ProjectListResponse> {
    const result = await this.listProjectsUsecase.execute({
      userId: request.user.userId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return projectListResponseSchema.parse({
      items: result.items.map((project) => ({
        id: project.id,
        name: project.name,
        deviceClass: project.deviceClass,
        targetJurisdictions: project.targetJurisdictions,
        organizationId: project.organizationId,
        createdAt: project.createdAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    });
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateProjectRequestDto,
  ): Promise<ProjectResponse> {
    const project = await this.createProjectUsecase.execute({
      userId: request.user.userId,
      plan: request.user.plan,
      name: body.name,
      deviceClass: body.deviceClass,
      targetJurisdictions: body.targetJurisdictions,
    });

    return projectResponseSchema.parse({
      id: project.id,
      name: project.name,
      deviceClass: project.deviceClass,
      targetJurisdictions: project.targetJurisdictions,
      organizationId: project.organizationId,
      createdAt: project.createdAt.toISOString(),
    });
  }

  @Get(":id")
  async detail(
    @Req() request: AuthenticatedRequest,
    @Param() params: ProjectIdParamDto,
  ): Promise<ProjectResponse> {
    const project = await this.getProjectDetailUsecase.execute({
      userId: request.user.userId,
      projectId: params.id,
    });

    return projectResponseSchema.parse({
      id: project.id,
      name: project.name,
      deviceClass: project.deviceClass,
      targetJurisdictions: project.targetJurisdictions,
      organizationId: project.organizationId,
      createdAt: project.createdAt.toISOString(),
    });
  }

  @Get(":id/tasks")
  async listTasks(
    @Req() request: AuthenticatedRequest,
    @Param() params: ProjectIdParamDto,
  ): Promise<ProjectTaskListResponse> {
    const tasks = await this.listProjectTasksUsecase.execute({
      userId: request.user.userId,
      projectId: params.id,
    });

    return projectTaskListResponseSchema.parse({
      items: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: toDateOnlyString(task.dueDate),
        assignee: task.assignee,
        createdAt: task.createdAt.toISOString(),
      })),
    });
  }

  @Post(":id/tasks")
  async createTask(
    @Req() request: AuthenticatedRequest,
    @Param() params: ProjectIdParamDto,
    @Body() body: CreateProjectTaskRequestDto,
  ): Promise<ProjectTaskResponse> {
    const task = await this.createProjectTaskUsecase.execute({
      userId: request.user.userId,
      projectId: params.id,
      title: body.title,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      assignee: body.assignee,
    });

    return projectTaskResponseSchema.parse({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: toDateOnlyString(task.dueDate),
      assignee: task.assignee,
      createdAt: task.createdAt.toISOString(),
    });
  }

  @Patch(":id/tasks/:taskId")
  async updateTaskStatus(
    @Req() request: AuthenticatedRequest,
    @Param() params: ProjectTaskIdParamDto,
    @Body() body: UpdateProjectTaskStatusRequestDto,
  ): Promise<ProjectTaskResponse> {
    const task = await this.updateProjectTaskStatusUsecase.execute({
      userId: request.user.userId,
      projectId: params.id,
      taskId: params.taskId,
      status: body.status,
    });

    return projectTaskResponseSchema.parse({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: toDateOnlyString(task.dueDate),
      assignee: task.assignee,
      createdAt: task.createdAt.toISOString(),
    });
  }

  @Post(":id/roadmap")
  async generateRoadmap(
    @Req() request: AuthenticatedRequest,
    @Param() params: ProjectIdParamDto,
    @Body() body: GenerateProjectRoadmapRequestDto,
  ): Promise<ProjectRoadmapResponse> {
    const roadmap = await this.generateProjectRoadmapUsecase.execute({
      userId: request.user.userId,
      plan: request.user.plan,
      projectId: params.id,
      templateId: body.templateId,
    });

    return projectRoadmapResponseSchema.parse({
      id: roadmap.id,
      projectId: roadmap.projectId,
      templateId: roadmap.templateId,
      generatedAt: roadmap.generatedAt.toISOString(),
      aiAdjustments: roadmap.aiAdjustments,
      status: roadmap.status,
      steps: roadmap.steps.map((step) => toRoadmapStepResponse(step)),
      createdAt: roadmap.createdAt.toISOString(),
      updatedAt: roadmap.updatedAt.toISOString(),
    });
  }

  @Get(":id/roadmap")
  async getRoadmap(
    @Req() request: AuthenticatedRequest,
    @Param() params: ProjectIdParamDto,
  ): Promise<ProjectRoadmapResponse> {
    const roadmap = await this.getProjectRoadmapUsecase.execute({
      userId: request.user.userId,
      projectId: params.id,
    });

    return projectRoadmapResponseSchema.parse({
      id: roadmap.id,
      projectId: roadmap.projectId,
      templateId: roadmap.templateId,
      generatedAt: roadmap.generatedAt.toISOString(),
      aiAdjustments: roadmap.aiAdjustments,
      status: roadmap.status,
      steps: roadmap.steps.map((step) => toRoadmapStepResponse(step)),
      createdAt: roadmap.createdAt.toISOString(),
      updatedAt: roadmap.updatedAt.toISOString(),
    });
  }

  @Patch(":id/roadmap/steps/:stepId")
  async updateRoadmapStep(
    @Req() request: AuthenticatedRequest,
    @Param() params: ProjectRoadmapStepIdParamDto,
    @Body() body: UpdateProjectRoadmapStepRequestDto,
  ): Promise<ProjectRoadmapStepResponse> {
    const step = await this.updateProjectRoadmapStepUsecase.execute({
      userId: request.user.userId,
      projectId: params.id,
      stepId: params.stepId,
      status: body.status,
      plannedStartDate: parseDateOnlyField(body.plannedStartDate),
      plannedEndDate: parseDateOnlyField(body.plannedEndDate),
      actualStartDate: parseDateOnlyField(body.actualStartDate),
      actualEndDate: parseDateOnlyField(body.actualEndDate),
      assigneeId: body.assigneeId,
    });

    return toRoadmapStepResponse(step);
  }
}

/**
 * PATCHの部分更新セマンティクス（undefined=変更なし、null=クリア、値=更新）をそのままusecase入力へ渡す。
 * body側はstring | null | undefined、usecase/repository側はDate | null | undefinedのため日付のみ変換する。
 */
function parseDateOnlyField(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value === null ? null : new Date(value);
}

function toRoadmapStepResponse(step: ProjectRoadmapStepDetail): ProjectRoadmapStepResponse {
  return projectRoadmapStepResponseSchema.parse({
    id: step.id,
    templateStep: {
      id: step.templateStep.id,
      phase: {
        code: step.templateStep.phase.code,
        name: step.templateStep.phase.name,
        order: step.templateStep.phase.order,
      },
      name: step.templateStep.name,
      order: step.templateStep.order,
      durationMinDays: step.templateStep.durationMinDays,
      durationMaxDays: step.templateStep.durationMaxDays,
      costMinJpy: step.templateStep.costMinJpy,
      costMaxJpy: step.templateStep.costMaxJpy,
      requiredDocuments: step.templateStep.requiredDocuments,
      requiredTests: step.templateStep.requiredTests,
      relatedRegulationIds: step.templateStep.relatedRegulationIds,
      pmdaResourceUrls: step.templateStep.pmdaResourceUrls,
      notes: step.templateStep.notes,
      sourceRefs: step.templateStep.sourceRefs,
    },
    status: step.status,
    plannedStartDate: toDateOnlyString(step.plannedStartDate),
    plannedEndDate: toDateOnlyString(step.plannedEndDate),
    actualStartDate: toDateOnlyString(step.actualStartDate),
    actualEndDate: toDateOnlyString(step.actualEndDate),
    assigneeId: step.assigneeId,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString(),
  });
}
