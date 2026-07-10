import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";
import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";

const ALREADY_PUBLISHED_MESSAGE = "既に公開済みです。";

/**
 * 工程マスタ公開ユースケース（設計変更書③「S20と同じdraft→publishフロー」、
 * POST /api/v1/admin/lifecycle-templates/:id/publish、admin/editor限定）。
 * regulation_versionの公開と異なり、旧公開版のクローズ処理は無い（design doc②「1エンティティで表現、
 * 親子分割なし」のため、本テーブルはstatusを直接DRAFT→PUBLISHEDへ遷移させるのみ）。
 */
@Injectable()
export class PublishLifecycleTemplateUsecase {
  constructor(
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
  ) {}

  async execute(id: string): Promise<LifecycleTemplateDetail> {
    const existing = await this.lifecycleTemplateRepository.findDetailByIdForAdmin(id);
    if (!existing) {
      throw new NotFoundException("指定された工程マスタが見つかりません。");
    }
    if (existing.status === "PUBLISHED") {
      throw new ConflictException(ALREADY_PUBLISHED_MESSAGE);
    }

    const published = await this.lifecycleTemplateRepository.publish(id);
    if (!published) {
      // 直前の事前チェックとの間に状態が変化した場合の防御的フォールバック（レース対策）。
      throw new ConflictException(ALREADY_PUBLISHED_MESSAGE);
    }

    return published;
  }
}
