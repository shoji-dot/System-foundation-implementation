import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type {
  LifecycleTemplateDetail,
  LifecycleTemplateSourceRef,
  LifecycleTemplateStep,
} from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";
import type { Plan } from "../domain/user.entity";

/**
 * FREEプランでは実務詳細フィールド（期間・費用・書類・試験・関連通知・根拠）を伏せた形（設計変更書①
 * S23「Free=閲覧のみ」、⑤「Free制限時は…データ自体は返さない」準拠）。id/phase/name/orderのみ
 * 全プラン共通で返す（どの工程が存在するかという骨組みまでは閲覧可能）。
 */
export type LifecycleTemplateStepView = Omit<
  LifecycleTemplateStep,
  "requiredDocuments" | "requiredTests" | "relatedRegulationIds" | "pmdaResourceUrls" | "sourceRefs"
> & {
  requiredDocuments: string[] | null;
  requiredTests: string[] | null;
  relatedRegulationIds: string[] | null;
  pmdaResourceUrls: string[] | null;
  sourceRefs: LifecycleTemplateSourceRef[] | null;
};

export interface LifecycleTemplateDetailView extends Omit<LifecycleTemplateDetail, "steps"> {
  steps: LifecycleTemplateStepView[];
}

export interface GetLifecycleTemplateDetailInput {
  id: string;
  plan: Plan;
}

/**
 * 工程マスタ詳細取得ユースケース（設計変更書③ GET /api/v1/lifecycle/templates/:id、Free=概要のみ）。
 * PROプラン以上でのみ実務詳細フィールドを返し、FREEはid/phase/name/orderのみの骨組みを返す
 * （実際の工数削減価値＝期間・費用・書類・試験・根拠が有料版の契約理由であるため、UI側での
 * 出し分けではなくAPI応答自体で制御する。設計変更書⑤「フロント制御のみの出し分け禁止」準拠）。
 */
@Injectable()
export class GetLifecycleTemplateDetailUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
  ) {}

  async execute(input: GetLifecycleTemplateDetailInput): Promise<LifecycleTemplateDetailView> {
    const detail = await this.lifecycleTemplateRepository.findPublishedDetailById(input.id);
    if (!detail) {
      throw new NotFoundException("指定された工程マスタが見つからないか、未公開です。");
    }

    if (input.plan === "FREE") {
      return { ...detail, steps: detail.steps.map((step) => this.maskStep(step)) };
    }

    return detail;
  }

  private maskStep(step: LifecycleTemplateStep): LifecycleTemplateStepView {
    return {
      ...step,
      durationMinDays: null,
      durationMaxDays: null,
      costMinJpy: null,
      costMaxJpy: null,
      requiredDocuments: null,
      requiredTests: null,
      relatedRegulationIds: null,
      pmdaResourceUrls: null,
      notes: null,
      sourceRefs: null,
    };
  }
}
