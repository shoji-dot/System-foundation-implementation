import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";

/**
 * 工程マスタ管理詳細ユースケース（設計変更書③ GET /api/v1/admin/lifecycle-templates/:id、admin/editor限定）。
 * 公開用詳細と異なりFREEプランのnullマスクを行わない（管理画面利用者は常に実務詳細を閲覧できる）。
 */
@Injectable()
export class GetAdminLifecycleTemplateDetailUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
  ) {}

  async execute(id: string): Promise<LifecycleTemplateDetail> {
    const detail = await this.lifecycleTemplateRepository.findDetailByIdForAdmin(id);
    if (!detail) {
      throw new NotFoundException("指定された工程マスタが見つかりません。");
    }

    return detail;
  }
}
