import type {
  PendingReviewVersionSummary,
  RegulationIngestionRepository,
} from "../domain/regulation-ingestion.repository";

import { ListPendingReviewVersionsUsecase } from "./list-pending-review-versions.usecase";

describe("ListPendingReviewVersionsUsecase", () => {
  const summary: PendingReviewVersionSummary = {
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
    const usecase = new ListPendingReviewVersionsUsecase(regulationIngestionRepository);
    return { usecase, regulationIngestionRepository };
  }

  it("delegates to the repository and returns the paginated result", async () => {
    const { usecase, regulationIngestionRepository } = setup();
    regulationIngestionRepository.listPendingReview.mockResolvedValue({
      items: [summary],
      nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    });

    const result = await usecase.execute({ cursor: undefined, limit: 20 });

    expect(regulationIngestionRepository.listPendingReview).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 20,
    });
    expect(result.items).toEqual([summary]);
    expect(result.nextCursor).toBe("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c");
  });
});
