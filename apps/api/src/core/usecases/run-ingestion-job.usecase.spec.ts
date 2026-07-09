import type { IngestionJob } from "../domain/ingestion-job.entity";
import type { IngestionJobRepository } from "../domain/ingestion-job.repository";
import type { RegulationIngestionRepository } from "../domain/regulation-ingestion.repository";
import type { RegulatorySource, SourceDocument, SourceListItem } from "../domain/regulatory-source";

import { RunIngestionJobUsecase } from "./run-ingestion-job.usecase";

/**
 * 2026-07-08: 複数Adapter対応でsourceがexecute()の引数に変わったことに伴う新規テスト
 * （リファクタ前は本usecase単体のテストが存在しなかった）。fetchDocument間のsleep(500ms)は
 * jest.useFakeTimers()では対応できない（Promiseベースのsetimeoutをテスト内でadvanceする必要があるが、
 * ここでは実時間で待っても1〜数件程度のためテスト時間への影響は無視できる）。
 */
describe("RunIngestionJobUsecase", () => {
  const baseItem: SourceListItem = {
    sourceDocId: "doc-1",
    title: "テスト文書",
    sourceUrl: "https://example.com/doc-1",
    issuedAt: new Date("2026-01-01T00:00:00.000Z"),
    noticeNumbers: [],
  };
  const baseDocument: SourceDocument = {
    sourceDocId: "doc-1",
    sourceUrl: "https://example.com/doc-1",
    rawContent: "本文",
    fetchedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  let ingestionJobRepository: jest.Mocked<IngestionJobRepository>;
  let regulationIngestionRepository: jest.Mocked<RegulationIngestionRepository>;
  let source: jest.Mocked<RegulatorySource>;
  let usecase: RunIngestionJobUsecase;

  const runningJob: IngestionJob = {
    id: "job-1",
    source: "TEST_SOURCE",
    status: "RUNNING",
    diffSummary: null,
    errorMessage: null,
    runAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    ingestionJobRepository = {
      create: jest.fn().mockResolvedValue(runningJob),
      update: jest
        .fn()
        .mockImplementation((_id, input) => Promise.resolve({ ...runningJob, ...input })),
    };
    regulationIngestionRepository = {
      findLatestByDocNumber: jest.fn(),
      createWithDraftVersion: jest.fn().mockResolvedValue({
        regulationId: "reg-1",
        versionId: "ver-1",
      }),
      appendDraftVersion: jest.fn().mockResolvedValue({ versionId: "ver-2" }),
      listPendingReview: jest.fn(),
      findPendingReviewDetail: jest.fn(),
      publishVersion: jest.fn(),
    };
    source = {
      sourceId: "TEST_SOURCE",
      fetchList: jest.fn(),
      fetchDocument: jest.fn().mockResolvedValue(baseDocument),
      normalize: jest.fn().mockResolvedValue({
        jurisdiction: "JP",
        type: "NOTICE",
        subtype: null,
        title: "テスト文書",
        docNumber: "doc-1",
        effectiveDate: baseItem.issuedAt,
        sourceUrl: baseItem.sourceUrl,
        fullText: "本文",
        contentHash: "hash-a",
      }),
    };
    usecase = new RunIngestionJobUsecase(ingestionJobRepository, regulationIngestionRepository);
  });

  it("creates a job record with the source's sourceId before processing", async () => {
    source.fetchList.mockResolvedValue([]);

    await usecase.execute(source);

    expect(ingestionJobRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: "TEST_SOURCE", status: "RUNNING" }),
    );
  });

  it("creates a new regulation when no existing one matches the docNumber", async () => {
    source.fetchList.mockResolvedValue([baseItem]);
    regulationIngestionRepository.findLatestByDocNumber.mockResolvedValue(null);

    const result = await usecase.execute(source);

    expect(regulationIngestionRepository.createWithDraftVersion).toHaveBeenCalledTimes(1);
    expect(regulationIngestionRepository.appendDraftVersion).not.toHaveBeenCalled();
    expect(result.status).toBe("SUCCEEDED");
    expect(result.diffSummary).toContain("新規: 1件");
  });

  it("appends a draft version when the existing fullText differs", async () => {
    source.fetchList.mockResolvedValue([baseItem]);
    regulationIngestionRepository.findLatestByDocNumber.mockResolvedValue({
      regulationId: "reg-1",
      latestVersionNo: 1,
      latestFullText: "旧本文",
    });

    const result = await usecase.execute(source);

    expect(regulationIngestionRepository.appendDraftVersion).toHaveBeenCalledTimes(1);
    expect(result.diffSummary).toContain("更新: 1件");
  });

  it("skips when the existing fullText is unchanged", async () => {
    source.fetchList.mockResolvedValue([baseItem]);
    regulationIngestionRepository.findLatestByDocNumber.mockResolvedValue({
      regulationId: "reg-1",
      latestVersionNo: 1,
      latestFullText: "本文",
    });

    const result = await usecase.execute(source);

    expect(regulationIngestionRepository.createWithDraftVersion).not.toHaveBeenCalled();
    expect(regulationIngestionRepository.appendDraftVersion).not.toHaveBeenCalled();
    expect(result.diffSummary).toContain("変更なし: 1件");
  });

  it("skips items whose issuedAt could not be parsed, without calling fetchDocument", async () => {
    source.fetchList.mockResolvedValue([{ ...baseItem, issuedAt: null }]);

    const result = await usecase.execute(source);

    expect(source.fetchDocument).not.toHaveBeenCalled();
    expect(result.diffSummary).toContain("スキップ: 1件");
  });

  it("marks the job as FAILED when fetchList throws", async () => {
    source.fetchList.mockRejectedValue(new Error("接続エラー"));

    const result = await usecase.execute(source);

    expect(ingestionJobRepository.update).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ status: "FAILED", errorMessage: "接続エラー" }),
    );
    expect(result.status).toBe("FAILED");
  });
});
