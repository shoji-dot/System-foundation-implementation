import { BadRequestException, Inject, Injectable } from "@nestjs/common";

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

export interface CreateLifecycleTemplateInput {
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

/**
 * 工程マスタ作成ユースケース（設計変更書③ POST /api/v1/admin/lifecycle-templates、admin/editor限定）。
 * 常にstatus=DRAFTで作成する（公開はPublishLifecycleTemplateUsecaseで別途行う、S20と同じdraft→publishフロー）。
 * jurisdiction/phaseCodeはZodのenumで形式検証済みだが、実DBにマスタ行が存在するかは別途ここで検証する
 * （enumに含まれていてもjurisdictions/lifecycle_phasesへの投入漏れがあり得るため）。
 */
@Injectable()
export class CreateLifecycleTemplateUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
    @Inject(JURISDICTION_REPOSITORY)
    private readonly jurisdictionRepository: JurisdictionRepository,
  ) {}

  async execute(input: CreateLifecycleTemplateInput): Promise<LifecycleTemplateDetail> {
    await this.validateJurisdiction(input.jurisdictionCode);
    await this.validatePhaseCodes(input.steps);

    return this.lifecycleTemplateRepository.create({
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
