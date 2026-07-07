import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type {
  CreateNotificationInput,
  NotificationRepository,
} from "../domain/notification.repository";
import { NOTIFICATION_REPOSITORY } from "../domain/notification.repository";
import type {
  PendingReviewVersionDetail,
  PublishVersionResult,
  RegulationIngestionRepository,
} from "../domain/regulation-ingestion.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../domain/regulation-ingestion.repository";
import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";
import { UPDATE_SUBSCRIPTION_REPOSITORY } from "../domain/update-subscription.repository";

const NOT_FOUND_MESSAGE = "指定された校閲対象の版が見つからないか、既に公開済みです。";

/**
 * 取込レビュー公開(publish)ユースケース（設計書⑫ S20、⑧編集ワークフロー: draft/review → published）。
 * 旧公開版のeffectiveToクローズ・Regulation.statusのAMENDED遷移はリポジトリ側のトランザクションで行う。
 * 公開成功後、一致する購読者へアプリ内通知を生成する（設計書⑨「published時: 購読ユーザーへ通知」、
 * メール配信は保留中のためアプリ内のみ。購読のfrequencyは無視し即時生成、要ユーザー確認済み）。
 */
@Injectable()
export class PublishRegulationVersionUsecase {
  constructor(
    @Inject(REGULATION_INGESTION_REPOSITORY)
    private readonly regulationIngestionRepository: RegulationIngestionRepository,
    @Inject(UPDATE_SUBSCRIPTION_REPOSITORY)
    private readonly updateSubscriptionRepository: UpdateSubscriptionRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
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

    await this.notifySubscribers(pending, result);

    return result;
  }

  private async notifySubscribers(
    pending: PendingReviewVersionDetail,
    result: PublishVersionResult,
  ): Promise<void> {
    const userIds = await this.updateSubscriptionRepository.findMatchingUserIds({
      jurisdictionCode: pending.jurisdiction.code,
      regulationType: pending.type,
    });

    if (userIds.length === 0) {
      return;
    }

    const inputs: CreateNotificationInput[] = userIds.map((userId) => ({
      userId,
      regulationVersionId: result.versionId,
      title: `${pending.regulationTitle}が更新されました`,
      body: pending.changeSummary,
    }));

    await this.notificationRepository.createMany(inputs);
  }
}
