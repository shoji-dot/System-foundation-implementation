import { NotFoundException } from "@nestjs/common";

import type {
  PendingReviewVersionDetail,
  RegulationIngestionRepository,
} from "../domain/regulation-ingestion.repository";

import { GetPendingReviewVersionDetailUsecase } from "./get-pending-review-version-detail.usecase";

describe("GetPendingReviewVersionDetailUsecase", () => {
  const detail: PendingReviewVersionDetail = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    regulationTitle: "医療機器の製造販売に関する通知",
    jurisdiction: { code: "JP", name: "日本" },
    type: "NOTICE",
    status: "DRAFT",
    versionNo: 2,
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    changeSummary: "本文の変更を検出しました（行数: 10→12、文字数: 200→230）。",
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
    fullText: "改正後の本文...",
    currentPublished: {
      versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      versionNo: 1,
      fullText: "改正前の本文...",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  };

  function setup() {
    const regulationIngestionRepository: jest.Mocked<RegulationIngestionRepository> = {
      findLatestByDocNumber: jest.fn(),
      createWithDraftVersion: jest.fn(),
      appendDraftVersion: jest.fn(),
      listPendingReview: jest.fn(),
      findPendingReviewDetail: jest.fn(),
    };
    const usecase = new GetPendingReviewVersionDetailUsecase(regulationIngestionRepository);
    return { usecase, regulationIngestionRepository };
  }

  it("returns the detail when found", async () => {
    const { usecase, regulationIngestionRepository } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(detail);

    const result = await usecase.execute(detail.id);

    expect(regulationIngestionRepository.findPendingReviewDetail).toHaveBeenCalledWith(detail.id);
    expect(result).toEqual(detail);
  });

  it("throws NotFoundException when the version does not exist or is not in review", async () => {
    const { usecase, regulationIngestionRepository } = setup();
    regulationIngestionRepository.findPendingReviewDetail.mockResolvedValue(null);

    await expect(usecase.execute(detail.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
