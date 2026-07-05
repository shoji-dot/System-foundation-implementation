import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type {
  PublishVersionResult,
  RegulationIngestionRepository,
} from "../domain/regulation-ingestion.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../domain/regulation-ingestion.repository";

const NOT_FOUND_MESSAGE = "指定された校閲対象の版が見つからないか、既に公開済みです。";

/**
 * 取込レビュー公開(publish)ユースケース（設計書⑫ S20、⑧編集ワークフロー: draft/review → published）。
 * 旧公開版のeffectiveToクローズ・Regulation.statusのAMENDED遷移はリポジトリ側のトランザクションで行う。
 */
@Injectable()
export class PublishRegulationVersionUsecase {
  constructor(
    @Inject(REGULATION_INGESTION_REPOSITORY)
    private readonly regulationIngestionRepository: RegulationIngestionRepository,
  ) {}

  async execute(versionId: string): Promise<PublishVersionResult> {
    // 存在しない/既にPUBLISHED済みの場合に区別のない404を返すため、事前に校閲対象として存在するか確認する。
    const pending = await this.regulationIngestionRepository.findPendingReviewDetail(versionId);
    if (!pending) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const result = await this.regulationIngestionRepository.publishVersion(versionId);
    if (!result) {
      // 直前のfindPendingReviewDetailとの間で状態が変化した場合の防御的フォールバック（レース対策）。
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    return result;
  }
}
