import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Tag } from "../domain/tag.entity";
import type { TagRepository } from "../domain/tag.repository";
import { TAG_REPOSITORY } from "../domain/tag.repository";

export interface UpdateTagInput {
  id: string;
  name: string;
}

/**
 * タグ名更新ユースケース（設計書④ tags、⑫ S21「タグ管理」）。
 */
@Injectable()
export class UpdateTagUsecase {
  constructor(@Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository) {}

  async execute(input: UpdateTagInput): Promise<Tag> {
    const existing = await this.tagRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException("指定されたタグが見つかりません。");
    }

    const normalizedName = input.name.trim();

    const duplicate = await this.tagRepository.findByName(normalizedName);
    if (duplicate && duplicate.id !== input.id) {
      throw new ConflictException("同名のタグが既に存在します。");
    }

    return this.tagRepository.update(input.id, { name: normalizedName });
  }
}
