import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { TaggingRepository } from "../domain/tagging.repository";
import { TAGGING_REPOSITORY } from "../domain/tagging.repository";

export interface DetachTagFromLessonInput {
  lessonId: string;
  tagId: string;
}

/**
 * レッスンからのタグ解除ユースケース（設計書④ taggings、⑫ S21「タグ管理」）。
 * レッスン自体の存在有無に関わらず、タグ付け(tagging)が存在しなければNotFoundとする
 * （解除操作の対象はtaggingそのものであり、二重チェックは不要なためlessonRepositoryは参照しない）。
 */
@Injectable()
export class DetachTagFromLessonUsecase {
  constructor(@Inject(TAGGING_REPOSITORY) private readonly taggingRepository: TaggingRepository) {}

  async execute(input: DetachTagFromLessonInput): Promise<void> {
    const exists = await this.taggingRepository.exists(input.tagId, "LESSON", input.lessonId);
    if (!exists) {
      throw new NotFoundException("指定されたタグ付けが見つかりません。");
    }

    await this.taggingRepository.delete(input.tagId, "LESSON", input.lessonId);
  }
}
