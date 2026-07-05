import type { UpdateFeedItem } from "../domain/update-feed-item.entity";
import type { UpdateFeedRepository } from "../domain/update-feed.repository";

import { ListUpdatesUsecase } from "./list-updates.usecase";

describe("ListUpdatesUsecase", () => {
  const item: UpdateFeedItem = {
    versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
    jurisdiction: { code: "JP", name: "日本" },
    type: "NOTICE",
    title: "医療機器の承認申請について",
    docNumber: "薬生機発0101第1号",
    versionNo: 2,
    changeSummary: "第3項を改正",
    publishedAt: new Date("2026-07-05T00:00:00.000Z"),
    effectiveFrom: new Date("2026-07-05T00:00:00.000Z"),
    regulationStatus: "AMENDED",
  };

  function setup() {
    const updateFeedRepository: jest.Mocked<UpdateFeedRepository> = {
      findMany: jest.fn(),
    };
    const usecase = new ListUpdatesUsecase(updateFeedRepository);
    return { usecase, updateFeedRepository };
  }

  it("converts since to a Date and delegates to the repository", async () => {
    const { usecase, updateFeedRepository } = setup();
    updateFeedRepository.findMany.mockResolvedValue({ items: [item], nextCursor: null });

    const result = await usecase.execute({
      since: "2026-07-01T00:00:00.000Z",
      jurisdiction: "JP",
      type: "NOTICE",
      cursor: undefined,
      limit: 20,
    });

    expect(updateFeedRepository.findMany).toHaveBeenCalledWith({
      since: new Date("2026-07-01T00:00:00.000Z"),
      jurisdictionCode: "JP",
      type: "NOTICE",
      cursor: undefined,
      limit: 20,
    });
    expect(result.items).toEqual([item]);
    expect(result.nextCursor).toBeNull();
  });

  it("omits since when not provided", async () => {
    const { usecase, updateFeedRepository } = setup();
    updateFeedRepository.findMany.mockResolvedValue({ items: [], nextCursor: null });

    await usecase.execute({ limit: 20 });

    expect(updateFeedRepository.findMany).toHaveBeenCalledWith({
      since: undefined,
      jurisdictionCode: undefined,
      type: undefined,
      cursor: undefined,
      limit: 20,
    });
  });
});
