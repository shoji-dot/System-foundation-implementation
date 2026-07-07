import { ConflictException, Inject, Injectable } from "@nestjs/common";

import type { Tag } from "../domain/tag.entity";
import type { TagRepository } from "../domain/tag.repository";
import { TAG_REPOSITORY } from "../domain/tag.repository";

export interface CreateTagInput {
  name: string;
}

/**
 * タグ作成ユースケース（設計書④ tags、⑫ S21「タグ管理」）。ADMIN/EDITOR限定
 * （設計書⑦ RBAC、S20と同様の管理系エンドポイントの方針）。
 */
@Injectable()
export class CreateTagUsecase {
  constructor(@Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository) {}

  async execute(input: CreateTagInput): Promise<Tag> {
    const normalizedName = input.name.trim();

    const existing = await this.tagRepository.findByName(normalizedName);
    if (existing) {
      throw new ConflictException("同名のタグが既に存在します。");
    }

    return this.tagRepository.create({ name: normalizedName });
  }
}
