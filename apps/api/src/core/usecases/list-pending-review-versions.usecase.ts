import { Inject, Injectable } from "@nestjs/common";

import type {
  PendingReviewVersionListResult,
  RegulationIngestionRepository,
} from "../domain/regulation-ingestion.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../domain/regulation-ingestion.repository";

export interface ListPendingReviewVersionsInput {
  cursor?: string;
  limit: number;
}

/**
 * 取込レビュー一覧取得ユースケース（設計書⑫ S20、管理: 取込レビュー）。
 * status=DRAFT/REVIEWの版一覧を作成日時昇順（キューとして古いものから処理する想定）で返す。
 */
@Injectable()
export class ListPendingReviewVersionsUsecase {
  constructor(
    @Inject(REGULATION_INGESTION_REPOSITORY)
    private readonly regulationIngestionRepository: RegulationIngestionRepository,
  ) {}

  async execute(input: ListPendingReviewVersionsInput): Promise<PendingReviewVersionListResult> {
    return this.regulationIngestionRepository.listPendingReview({
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
