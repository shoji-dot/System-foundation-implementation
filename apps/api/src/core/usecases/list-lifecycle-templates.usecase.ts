import { Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { LifecycleDeviceCategory } from "../domain/lifecycle-template.entity";
import type {
  LifecycleTemplateListResult,
  LifecycleTemplateRepository,
} from "../domain/lifecycle-template.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";

export interface ListLifecycleTemplatesInput {
  jurisdiction?: JurisdictionCode;
  deviceCategory?: LifecycleDeviceCategory;
  procedureType?: string;
  cursor?: string;
  limit: number;
}

/**
 * 工程マスタ一覧取得ユースケース（設計変更書③ GET /api/v1/lifecycle/templates、Free可）。
 * 公開済み(PUBLISHED)テンプレートのみを対象とする（リポジトリ側でフィルタ）。
 */
@Injectable()
export class ListLifecycleTemplatesUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
  ) {}

  async execute(input: ListLifecycleTemplatesInput): Promise<LifecycleTemplateListResult> {
    return this.lifecycleTemplateRepository.findManyPublished({
      jurisdictionCode: input.jurisdiction,
      deviceCategory: input.deviceCategory,
      procedureType: input.procedureType,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
