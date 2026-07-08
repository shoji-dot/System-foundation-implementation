import type { Job } from "bullmq";

import type { RegulatorySource } from "../../core/domain/regulatory-source";
import type { RunIngestionJobUsecase } from "../../core/usecases/run-ingestion-job.usecase";

import { IngestionProcessor } from "./ingestion.processor";

/**
 * 2026-07-08: 複数Adapter対応の新規テスト。job.data.sourceIdからREGULATORY_SOURCES配列内の
 * 対象Adapterを正しく解決してusecaseへ渡すこと、未登録sourceIdの場合は即失敗することを検証する。
 */
describe("IngestionProcessor", () => {
  const makeSource = (sourceId: string): RegulatorySource => ({
    sourceId,
    fetchList: jest.fn(),
    fetchDocument: jest.fn(),
    normalize: jest.fn(),
  });

  const succeededJob = {
    id: "job-1",
    source: "PMDA_DEVICE_SAFETY_NOTICES",
    status: "SUCCEEDED" as const,
    diffSummary: "新規: 0件、更新: 0件、変更なし: 0件、スキップ: 0件",
    errorMessage: null,
    runAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("resolves the matching source by job.data.sourceId and executes the usecase with it", async () => {
    const pmda = makeSource("PMDA_DEVICE_SAFETY_NOTICES");
    const fda = makeSource("FDA_FEDERAL_REGISTER_DEVICE_NOTICES");
    const execute = jest.fn().mockResolvedValue(succeededJob);
    const usecase = { execute } as unknown as jest.Mocked<RunIngestionJobUsecase>;
    const processor = new IngestionProcessor(usecase, [pmda, fda]);
    const job = { id: "1", data: { sourceId: "FDA_FEDERAL_REGISTER_DEVICE_NOTICES" } } as Job<{
      sourceId: string;
    }>;

    await processor.process(job);

    expect(execute).toHaveBeenCalledWith(fda);
  });

  it("throws immediately when job.data.sourceId matches no registered source", async () => {
    const pmda = makeSource("PMDA_DEVICE_SAFETY_NOTICES");
    const usecase = { execute: jest.fn() } as unknown as jest.Mocked<RunIngestionJobUsecase>;
    const processor = new IngestionProcessor(usecase, [pmda]);
    const job = { id: "1", data: { sourceId: "UNKNOWN" } } as Job<{ sourceId: string }>;

    await expect(processor.process(job)).rejects.toThrow("UNKNOWN");
    expect(usecase.execute).not.toHaveBeenCalled();
  });

  it("throws when the usecase result status is FAILED, so BullMQ retries via attempts/backoff", async () => {
    const pmda = makeSource("PMDA_DEVICE_SAFETY_NOTICES");
    const execute = jest.fn().mockResolvedValue({
      ...succeededJob,
      status: "FAILED",
      errorMessage: "接続エラー",
    });
    const usecase = { execute } as unknown as jest.Mocked<RunIngestionJobUsecase>;
    const processor = new IngestionProcessor(usecase, [pmda]);
    const job = { id: "1", data: { sourceId: "PMDA_DEVICE_SAFETY_NOTICES" } } as Job<{
      sourceId: string;
    }>;

    await expect(processor.process(job)).rejects.toThrow("接続エラー");
  });
});
