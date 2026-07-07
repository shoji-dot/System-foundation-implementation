import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Classification } from "../domain/classification.entity";
import type { ClassificationRepository } from "../domain/classification.repository";
import { CLASSIFICATION_REPOSITORY } from "../domain/classification.repository";

/**
 * 機器分類詳細取得ユースケース（設計書⑤に明記は無いがS09「分類詳細」表示に必要なため
 * ユーザー承認済みで追加、GET /api/v1/classifications/:id）。
 */
@Injectable()
export class GetClassificationDetailUsecase {
  constructor(
    @Inject(CLASSIFICATION_REPOSITORY)
    private readonly classificationRepository: ClassificationRepository,
  ) {}

  async execute(id: string): Promise<Classification> {
    const classification = await this.classificationRepository.findById(id);
    if (!classification) {
      throw new NotFoundException("指定された機器分類が見つかりません。");
    }
    return classification;
  }
}
