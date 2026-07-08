import { NotFoundException } from "@nestjs/common";

import type { NotificationRepository } from "../domain/notification.repository";
import type {
  PendingReviewVersionDetail,
  PublishVersionResult,
  RegulationIngestionRepository,
} from "../domain/regulation-ingestion.repository";
import type { UpdateSubscriptionRepository } from "../domain/update-subscription.repository";

import { PublishRegulationVersionUsecase } from "./publish-regulation-version.usecase";
import { RecordAuditLogUsecase } from "./record-audit-log.usecase";

describe("PublishRegulationVersionUsecase", () => {
  const versionId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c";
  const actorId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f";

  const pendingDetail: PendingReviewVersionDetail = {
    id: versionId,
    regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    regulationTitle: "医療機器の製造販売に関する通知",
    jurisdiction: { code: "JP", name: "日本" },
    type: "NOTICE",
    status: "DRAFT",
    versionNo: 2,
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    changeSummary: "本文の変更を検出しました。",
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
    fullText: "改正後の本文...",
    currentPublished: {
      versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      versionNo: 1,
      fullText: "改正前の本文...",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  };

  const publishResult: PublishVersionResult = {
    regulationId: pendingDetail.regulationId,
    versionId,
    versionNo: 2,
    publishedAt: new Date("2026-07-05T12:00:00.000Z"),
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    regulationStatus: "AMENDED",
    closedPreviousVersion: {
      versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      effectiveTo: new Date("2026-07-01T00:00:00.000Z"),
    },
  };

  function setup() {
    const regulationIngestionRepository: jest.Mocked<RegulationIngestionRepository> = {
      findLatestByDocNumber: jest.fn(),
      createWithDraftVersion: jest.fn(),
      appendDraftVersion: jest.fn(),
      listPendingReview: jest.fn(),
      findPendingReviewDetail: jest.fn(),
      publishVersion: jest.fn(),
    };
    const updateSubscriptionRepository: jest.Mocked<UpdateSubscriptionRepository> = {
      existsForUser: jest.fn(),
      create: jest.fn(),
      findMatchingUserIds: jest.fn().mockResolvedValue([]),
      findManyForUser: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      countForUser: jest.fn(),
    };
    const notificationRepository: jest.Mocked<NotificationRepository> = {
      createMany: jest.fn(),
      findManyForUser: jest.fn(),
    };
    const recordAuditLogUsecase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordAuditLogUsecase>;
    const usecase = new PublishRegulationVersionUsecase(
      regulationIngestionRepository,
      updateSubscriptionRepository,
      notificationRepository,
      recordAuditLogUsecase,
    );
    return {
      usecase,
      regulationIngestionRepository,
      updateSubscriptionRepository,
      notificationRepository,
      recordAuditLogUsecase,
    };
  }

  it("publishes the version and returns the result", async () => {
    const { usecase, regulationIngestionRepository } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(pendingDetail);
    regulationIngestionRepository.publishVersion.mockResolvedValue(publishResult);

    const result = await usecase.execute(versionId, actorId);

    expect(regulationIngestionRepository.findPendingReviewDetail).toHaveBeenCalledWith(versionId);
    expect(regulationIngestionRepository.publishVersion).toHaveBeenCalledWith(versionId);
    expect(result).toEqual(publishResult);
  });

  it("throws NotFoundException when the version is not pending review (missing or already published)", async () => {
    const { usecase, regulationIngestionRepository } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(null);

    await expect(usecase.execute(versionId, actorId)).rejects.toBeInstanceOf(NotFoundException);
    expect(regulationIngestionRepository.publishVersion).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when publishVersion returns null despite the prior check (race condition)", async () => {
    const { usecase, regulationIngestionRepository } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(pendingDetail);
    regulationIngestionRepository.publishVersion.mockResolvedValue(null);

    await expect(usecase.execute(versionId, actorId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("records an audit log entry for the publish action", async () => {
    const { usecase, regulationIngestionRepository, recordAuditLogUsecase } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(pendingDetail);
    regulationIngestionRepository.publishVersion.mockResolvedValue(publishResult);

    await usecase.execute(versionId, actorId);

    expect(recordAuditLogUsecase.execute).toHaveBeenCalledWith({
      actorId,
      action: "regulation_version.publish",
      target: `regulation_version:${publishResult.versionId}`,
    });
  });

  it("does not record an audit log entry when the version is not pending review", async () => {
    const { usecase, regulationIngestionRepository, recordAuditLogUsecase } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(null);

    await expect(usecase.execute(versionId, actorId)).rejects.toBeInstanceOf(NotFoundException);
    expect(recordAuditLogUsecase.execute).not.toHaveBeenCalled();
  });

  it("creates notifications for users whose subscription matches the published jurisdiction/type", async () => {
    const {
      usecase,
      regulationIngestionRepository,
      updateSubscriptionRepository,
      notificationRepository,
    } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(pendingDetail);
    regulationIngestionRepository.publishVersion.mockResolvedValue(publishResult);
    updateSubscriptionRepository.findMatchingUserIds.mockResolvedValue(["user-1", "user-2"]);

    await usecase.execute(versionId, actorId);

    expect(updateSubscriptionRepository.findMatchingUserIds).toHaveBeenCalledWith({
      jurisdictionCode: pendingDetail.jurisdiction.code,
      regulationType: pendingDetail.type,
    });
    expect(notificationRepository.createMany).toHaveBeenCalledWith([
      {
        userId: "user-1",
        regulationVersionId: publishResult.versionId,
        title: `${pendingDetail.regulationTitle}が更新されました`,
        body: pendingDetail.changeSummary,
      },
      {
        userId: "user-2",
        regulationVersionId: publishResult.versionId,
        title: `${pendingDetail.regulationTitle}が更新されました`,
        body: pendingDetail.changeSummary,
      },
    ]);
  });

  it("does not call createMany when no subscription matches", async () => {
    const {
      usecase,
      regulationIngestionRepository,
      updateSubscriptionRepository,
      notificationRepository,
    } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(pendingDetail);
    regulationIngestionRepository.publishVersion.mockResolvedValue(publishResult);
    updateSubscriptionRepository.findMatchingUserIds.mockResolvedValue([]);

    await usecase.execute(versionId, actorId);

    expect(notificationRepository.createMany).not.toHaveBeenCalled();
  });
});
