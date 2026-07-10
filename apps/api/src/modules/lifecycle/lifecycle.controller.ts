import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import type {
  LifecycleTemplateDetailResponse,
  LifecycleTemplateListResponse,
} from "@yakuji/shared";
import {
  lifecycleTemplateDetailResponseSchema,
  lifecycleTemplateListResponseSchema,
} from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import type { LifecycleTemplateStepView } from "../../core/usecases/get-lifecycle-template-detail.usecase";
import { GetLifecycleTemplateDetailUsecase } from "../../core/usecases/get-lifecycle-template-detail.usecase";
import { ListLifecycleTemplatesUsecase } from "../../core/usecases/list-lifecycle-templates.usecase";

import { LifecycleTemplateIdParamDto } from "./dto/lifecycle-template-id-param.dto";
import { ListLifecycleTemplatesQueryDto } from "./dto/list-lifecycle-templates-query.dto";

/**
 * 設計変更書③ GET /api/v1/lifecycle/templates、/lifecycle/templates/:id（工程マスタ、Free可）。
 * 全プラン共通で認証のみ要求する（RolesGuard無し）。FREEプランの実務詳細マスクはusecase層で行う
 * （設計変更書⑤「フロント制御のみの出し分け禁止」準拠）。
 */
@Controller("lifecycle/templates")
@UseGuards(JwtAuthGuard)
export class LifecycleController {
  constructor(
    private readonly listLifecycleTemplatesUsecase: ListLifecycleTemplatesUsecase,
    private readonly getLifecycleTemplateDetailUsecase: GetLifecycleTemplateDetailUsecase,
  ) {}

  @Get()
  async list(
    @Query() query: ListLifecycleTemplatesQueryDto,
  ): Promise<LifecycleTemplateListResponse> {
    const result = await this.listLifecycleTemplatesUsecase.execute({
      jurisdiction: query.jurisdiction,
      deviceCategory: query.deviceCategory,
      procedureType: query.procedureType,
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
    @Req() request: AuthenticatedRequest,
  ): Promise<LifecycleTemplateDetailResponse> {
    const detail = await this.getLifecycleTemplateDetailUsecase.execute({
      id: params.id,
      plan: request.user.plan,
    });

    return lifecycleTemplateDetailResponseSchema.parse({
      id: detail.id,
      jurisdiction: detail.jurisdiction,
      deviceCategory: detail.deviceCategory,
      procedureType: detail.procedureType,
      status: detail.status,
      version: detail.version,
      createdAt: detail.createdAt.toISOString(),
      steps: detail.steps.map((step) => this.toStepResponse(step)),
    });
  }

  private toStepResponse(step: LifecycleTemplateStepView) {
    return {
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
    };
  }
}
