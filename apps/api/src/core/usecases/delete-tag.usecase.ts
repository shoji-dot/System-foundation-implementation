import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { TagRepository } from "../domain/tag.repository";
import { TAG_REPOSITORY } from "../domain/tag.repository";

/**
 * タグ削除ユースケース（設計書④ tags、⑫ S21「タグ管理」）。物理削除
 * （設計書④「論理削除は法規制系のみ」の方針、taggingsはDB側のonDelete Cascadeで併せて削除される）。
 */
@Injectable()
export class DeleteTagUsecase {
  constructor(@Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.tagRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("指定されたタグが見つかりません。");
    }

    await this.tagRepository.delete(id);
  }
}
