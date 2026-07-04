import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { ClassificationMappingSummary } from "../domain/classification.entity";
import type { ClassificationRepository } from "../domain/classification.repository";
import { CLASSIFICATION_REPOSITORY } from "../domain/classification.repository";

/**
 * 機器分類マッピング取得ユースケース（設計書⑤ GET /api/v1/classifications/:id/mappings、S09）。
 */
@Injectable()
export class GetClassificationMappingsUsecase {
  constructor(
    @Inject(CLASSIFICATION_REPOSITORY)
    private readonly classificationRepository: ClassificationRepository,
  ) {}

  async execute(classificationId: string): Promise<ClassificationMappingSummary[]> {
    const result =
      await this.classificationRepository.findMappingsByClassificationId(classificationId);
    if (!result) {
      throw new NotFoundException("指定された機器分類が見つかりません。");
    }
    return result;
  }
}
