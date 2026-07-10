import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type {
  LifecycleTemplateDetailResponse,
  LifecycleTemplateListResponse,
} from "@yakuji/shared";
import {
  lifecycleTemplateDetailResponseSchema,
  lifecycleTemplateListResponseSchema,
} from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { LifecycleTemplateDetail } from "../../core/domain/lifecycle-template.entity";
import { CreateLifecycleTemplateUsecase } from "../../core/usecases/create-lifecycle-template.usecase";
import { DeleteLifecycleTemplateUsecase } from "../../core/usecases/delete-lifecycle-template.usecase";
import { GetAdminLifecycleTemplateDetailUsecase } from "../../core/usecases/get-admin-lifecycle-template-detail.usecase";
import { ListAdminLifecycleTemplatesUsecase } from "../../core/usecases/list-admin-lifecycle-templates.usecase";
import { PublishLifecycleTemplateUsecase } from "../../core/usecases/publish-lifecycle-template.usecase";
import { UpdateLifecycleTemplateUsecase } from "../../core/usecases/update-lifecycle-template.usecase";

import { CreateLifecycleTemplateRequestDto } from "./dto/create-lifecycle-template-request.dto";
import { LifecycleTemplateIdParamDto } from "./dto/lifecycle-template-id-param.dto";
import { ListAdminLifecycleTemplatesQueryDto } from "./dto/list-admin-lifecycle-templates-query.dto";
import { UpdateLifecycleTemplateRequestDto } from "./dto/update-lifecycle-template-request.dto";

/**
 * 設計書⑤ CRUD /api/v1/admin/lifecycle-templates（S22 工程マスタ管理、admin/editor限定、
 * 「S20と同じdraft→publishフロー」）。作成/更新は工程一覧込みで1ドキュメントとして丸ごと扱う
 * （regulation_versionsのfullText同様）。PUBLISHED済みの編集・削除は不可（不変原則）。
 */
@Controller("admin/lifecycle-templates")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class AdminLifecycleTemplatesController {
  constructor(
    private readonly createLifecycleTemplateUsecase: CreateLifecycleTemplateUsecase,
    private readonly updateLifecycleTemplateUsecase: UpdateLifecycleTemplateUsecase,
    private readonly deleteLifecycleTemplateUsecase: DeleteLifecycleTemplateUsecase,
    private readonly publishLifecycleTemplateUsecase: PublishLifecycleTemplateUsecase,
    private readonly listAdminLifecycleTemplatesUsecase: ListAdminLifecycleTemplatesUsecase,
    private readonly getAdminLifecycleTemplateDetailUsecase: GetAdminLifecycleTemplateDetailUsecase,
  ) {}

  @Get()
  async list(
    @Query() query: ListAdminLifecycleTemplatesQueryDto,
  ): Promise<LifecycleTemplateListResponse> {
    const result = await this.listAdminLifecycleTemplatesUsecase.execute({
      jurisdiction: query.jurisdiction,
      deviceCategory: query.deviceCategory,
      procedureType: query.procedureType,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    });

    return lifecycleTemplateListResponseSchema.parse({
      items: result.items.map((template) => ({
        id: template.id,
        jurisdiction: template.jurisdiction,
        deviceCategory: template.deviceCategory,
        procedureType: template.procedureType,
        status: template.status,
        version: template.version,
        createdAt: template.createdAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    });
  }

  @Get(":id")
  async detail(
    @Param() params: LifecycleTemplateIdParamDto,
  ): Promise<LifecycleTemplateDetailResponse> {
    const detail = await this.getAdminLifecycleTemplateDetailUsecase.execute(params.id);
    return lifecycleTemplateDetailResponseSchema.parse(toDetailResponse(detail));
  }

  @Post()
  async create(
    @Body() body: CreateLifecycleTemplateRequestDto,
  ): Promise<LifecycleTemplateDetailResponse> {
    const created = await this.createLifecycleTemplateUsecase.execute({
      jurisdictionCode: body.jurisdiction,
      deviceCategory: body.deviceCategory,
      procedureType: body.procedureType,
      steps: body.steps,
    });

    return lifecycleTemplateDetailResponseSchema.parse(toDetailResponse(created));
  }

  @Patch(":id")
  async update(
    @Param() params: LifecycleTemplateIdParamDto,
    @Body() body: UpdateLifecycleTemplateRequestDto,
  ): Promise<LifecycleTemplateDetailResponse> {
    const updated = await this.updateLifecycleTemplateUsecase.execute({
      id: params.id,
      jurisdictionCode: body.jurisdiction,
      deviceCategory: body.deviceCategory,
      procedureType: body.procedureType,
      steps: body.steps,
    });

    return lifecycleTemplateDetailResponseSchema.parse(toDetailResponse(updated));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: LifecycleTemplateIdParamDto): Promise<void> {
    await this.deleteLifecycleTemplateUsecase.execute(params.id);
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param() params: LifecycleTemplateIdParamDto,
  ): Promise<LifecycleTemplateDetailResponse> {
    const published = await this.publishLifecycleTemplateUsecase.execute(params.id);
    return lifecycleTemplateDetailResponseSchema.parse(toDetailResponse(published));
  }
}

function toDetailResponse(detail: LifecycleTemplateDetail) {
  return {
    id: detail.id,
    jurisdiction: detail.jurisdiction,
    deviceCategory: detail.deviceCategory,
    procedureType: detail.procedureType,
    status: detail.status,
    version: detail.version,
    createdAt: detail.createdAt.toISOString(),
    steps: detail.steps.map((step) => ({
      id: step.id,
      phase: { code: step.phase.code, name: step.phase.name, order: step.phase.order },
      name: step.name,
      order: step.order,
      durationMinDays: step.durationMinDays,
      durationMaxDays: step.durationMaxDays,
      costMinJpy: step.costMinJpy,
      costMaxJpy: step.costMaxJpy,
      requiredDocuments: step.requiredDocuments,
      requiredTests: step.requiredTests,
      relatedRegulationIds: step.relatedRegulationIds,
      pmdaResourceUrls: step.pmdaResourceUrls,
      notes: step.notes,
      sourceRefs: step.sourceRefs,
    })),
  };
}
