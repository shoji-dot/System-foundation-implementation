import { Inject, Injectable } from "@nestjs/common";

import type { ClassificationScheme } from "../domain/classification.entity";
import type {
  ClassificationListResult,
  ClassificationRepository,
} from "../domain/classification.repository";
import { CLASSIFICATION_REPOSITORY } from "../domain/classification.repository";
import type { JurisdictionCode } from "../domain/jurisdiction.entity";

export interface ListClassificationsInput {
  scheme?: ClassificationScheme;
  jurisdiction?: JurisdictionCode;
  q?: string;
  cursor?: string;
  limit: number;
}

/**
 * 機器分類一覧・検索取得ユースケース（設計書⑤ GET /api/v1/classifications?scheme=&q=、S08）。
 */
@Injectable()
export class ListClassificationsUsecase {
  constructor(
    @Inject(CLASSIFICATION_REPOSITORY)
    private readonly classificationRepository: ClassificationRepository,
  ) {}

  async execute(input: ListClassificationsInput): Promise<ClassificationListResult> {
    const q = input.q?.trim();

    return this.classificationRepository.findMany({
      scheme: input.scheme,
      jurisdictionCode: input.jurisdiction,
      q: q ? q : undefined,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
