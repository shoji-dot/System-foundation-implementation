import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type {
  PendingReviewVersionDetail,
  RegulationIngestionRepository,
} from "../domain/regulation-ingestion.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../domain/regulation-ingestion.repository";

/**
 * 取込レビュー詳細取得ユースケース（設計書⑫ S20、管理: 取込レビュー）。
 * 校閲対象の版本文と、比較対象となる現行公開版（初版の場合はnull）を返す。
 */
@Injectable()
export class GetPendingReviewVersionDetailUsecase {
  constructor(
    @Inject(REGULATION_INGESTION_REPOSITORY)
    private readonly regulationIngestionRepository: RegulationIngestionRepository,
  ) {}

  async execute(versionId: string): Promise<PendingReviewVersionDetail> {
    const detail = await this.regulationIngestionRepository.findPendingReviewDetail(versionId);

    if (!detail) {
      throw new NotFoundException("指定された校閲対象の版が見つかりません。");
    }

    return detail;
  }
}
