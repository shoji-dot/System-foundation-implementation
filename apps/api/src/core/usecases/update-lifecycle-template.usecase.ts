import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { JurisdictionRepository } from "../domain/jurisdiction.repository";
import { JURISDICTION_REPOSITORY } from "../domain/jurisdiction.repository";
import type {
  LifecycleDeviceClass,
  LifecycleFramework,
  LifecycleProductNovelty,
  LifecycleTemplateDetail,
} from "../domain/lifecycle-template.entity";
import type {
  LifecycleTemplateRepository,
  LifecycleTemplateStepWriteInput,
} from "../domain/lifecycle-template.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";

export interface UpdateLifecycleTemplateInput {
  id: string;
  jurisdictionCode: JurisdictionCode;
  framework: LifecycleFramework;
  deviceClass: LifecycleDeviceClass | null;
  productNovelty: LifecycleProductNovelty | null;
  approvalRoute: string;
  characteristics: string[];
  effectiveFrom: Date;
  effectiveTo: Date | null;
  steps: LifecycleTemplateStepWriteInput[];
}

const NOT_DRAFT_MESSAGE =
  "公開済みの工程マスタは編集できません。新しいテンプレートを作成してください。";

/**
 * 工程マスタ更新ユースケース（設計変更書③ PATCH /api/v1/admin/lifecycle-templates/:id、admin/editor限定）。
 * DRAFTのテンプレートのみ編集可能（PUBLISHEDは不変、regulation_versionsと同じ「公開後は不変」原則）。
 * 工程一覧は個別差分ではなく丸ごと置き換える（1ドキュメントとして扱う設計、create時と同一入力形状）。
 */
@Injectable()
export class UpdateLifecycleTemplateUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
    @Inject(JURISDICTION_REPOSITORY)
    private readonly jurisdictionRepository: JurisdictionRepository,
  ) {}

  async execute(input: UpdateLifecycleTemplateInput): Promise<LifecycleTemplateDetail> {
    const existing = await this.lifecycleTemplateRepository.findDetailByIdForAdmin(input.id);
    if (!existing) {
      throw new NotFoundException("指定された工程マスタが見つかりません。");
    }
    if (existing.status !== "DRAFT") {
      throw new ConflictException(NOT_DRAFT_MESSAGE);
    }

    await this.validateJurisdiction(input.jurisdictionCode);
    await this.validatePhaseCodes(input.steps);

    const updated = await this.lifecycleTemplateRepository.update(input.id, {
      jurisdictionCode: input.jurisdictionCode,
      framework: input.framework,
      deviceClass: input.deviceClass,
      productNovelty: input.productNovelty,
      approvalRoute: input.approvalRoute.trim(),
      characteristics: input.characteristics,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      steps: input.steps,
    });

    if (!updated) {
      // 直前の事前チェックとの間に状態が変化した場合の防御的フォールバック（レース対策）。
      throw new ConflictException(NOT_DRAFT_MESSAGE);
    }

    return updated;
  }

  private async validateJurisdiction(code: JurisdictionCode): Promise<void> {
    const jurisdictions = await this.jurisdictionRepository.findAll();
    if (!jurisdictions.some((jurisdiction) => jurisdiction.code === code)) {
      throw new BadRequestException(
        `法域コード ${code} はまだ登録されていません。先にjurisdictionsへ登録してください。`,
      );
    }
  }

  private async validatePhaseCodes(steps: LifecycleTemplateStepWriteInput[]): Promise<void> {
    const phases = await this.lifecycleTemplateRepository.findAllPhases();
    const knownCodes = new Set(phases.map((phase) => phase.code));
    const missing = [...new Set(steps.map((step) => step.phaseCode))].filter(
      (code) => !knownCodes.has(code),
    );

    if (missing.length > 0) {
      throw new BadRequestException(
        `大工程コード ${missing.join(", ")} はまだlifecycle_phasesに登録されていません。`,
      );
    }
  }
}
