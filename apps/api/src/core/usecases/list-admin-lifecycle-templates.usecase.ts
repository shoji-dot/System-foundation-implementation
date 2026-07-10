import { Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type {
  LifecycleDeviceClass,
  LifecycleFramework,
  LifecycleTemplateStatus,
} from "../domain/lifecycle-template.entity";
import type {
  LifecycleTemplateListResult,
  LifecycleTemplateRepository,
} from "../domain/lifecycle-template.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";

export interface ListAdminLifecycleTemplatesInput {
  jurisdiction?: JurisdictionCode;
  framework?: LifecycleFramework;
  deviceClass?: LifecycleDeviceClass;
  approvalRoute?: string;
  status?: LifecycleTemplateStatus;
  cursor?: string;
  limit: number;
}

/**
 * 工程マスタ管理一覧ユースケース（設計変更書③ GET /api/v1/admin/lifecycle-templates、admin/editor限定）。
 * 公開用一覧と異なりDRAFTを含む全ステータスを対象とする。
 */
@Injectable()
export class ListAdminLifecycleTemplatesUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
  ) {}

  async execute(input: ListAdminLifecycleTemplatesInput): Promise<LifecycleTemplateListResult> {
    return this.lifecycleTemplateRepository.findManyForAdmin({
      jurisdictionCode: input.jurisdiction,
      framework: input.framework,
      deviceClass: input.deviceClass,
      approvalRoute: input.approvalRoute,
      status: input.status,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
