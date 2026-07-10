import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";

const NOT_DRAFT_MESSAGE = "公開済みの工程マスタは削除できません。";

/**
 * 工程マスタ削除ユースケース（設計変更書③ DELETE /api/v1/admin/lifecycle-templates/:id、admin/editor限定）。
 * DRAFTのテンプレートのみ削除可能（PUBLISHED済みは公開中の参照整合性を守るため物理削除を禁止、YAGNI:
 * アーカイブ/非公開化操作は設計変更書に明記が無いためスコープ外）。
 */
@Injectable()
export class DeleteLifecycleTemplateUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.lifecycleTemplateRepository.findDetailByIdForAdmin(id);
    if (!existing) {
      throw new NotFoundException("指定された工程マスタが見つかりません。");
    }
    if (existing.status !== "DRAFT") {
      throw new ConflictException(NOT_DRAFT_MESSAGE);
    }

    const deleted = await this.lifecycleTemplateRepository.delete(id);
    if (!deleted) {
      // 直前の事前チェックとの間に状態が変化した場合の防御的フォールバック（レース対策）。
      throw new ConflictException(NOT_DRAFT_MESSAGE);
    }
  }
}
