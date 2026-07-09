import { Inject, Injectable } from "@nestjs/common";

import type { TagListResult, TagRepository } from "../domain/tag.repository";
import { TAG_REPOSITORY } from "../domain/tag.repository";

export interface ListTagsInput {
  cursor?: string;
  limit: number;
}

/**
 * タグ一覧取得ユースケース（設計書④ tags、⑫ S21「タグ管理」）。
 */
@Injectable()
export class ListTagsUsecase {
  constructor(@Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository) {}

  async execute(input: ListTagsInput): Promise<TagListResult> {
    return this.tagRepository.list(input);
  }
}
