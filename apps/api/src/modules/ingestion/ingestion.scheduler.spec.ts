import type { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import type { RegulatorySource } from "../../core/domain/regulatory-source";

import { INGESTION_JOB_NAME } from "./ingestion.constants";
import { IngestionScheduler } from "./ingestion.scheduler";

/**
 * 2026-07-08: 複数Adapter対応の新規テスト。Adapterごとに個別のrepeatable jobが
 * jobId分離・sourceId付きdataで登録されることを検証する。
 */
describe("IngestionScheduler", () => {
  const makeSource = (sourceId: string): RegulatorySource => ({
    sourceId,
    fetchList: jest.fn(),
    fetchDocument: jest.fn(),
    normalize: jest.fn(),
  });

  it("registers one repeatable job per registered source, with jobId separated by sourceId", async () => {
    const queue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<ConfigService>;
    const sources = [
      makeSource("PMDA_DEVICE_SAFETY_NOTICES"),
      makeSource("FDA_FEDERAL_REGISTER_DEVICE_NOTICES"),
    ];
    const scheduler = new IngestionScheduler(queue, config, sources);

    await scheduler.onModuleInit();

    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(queue.add).toHaveBeenCalledWith(
      INGESTION_JOB_NAME,
      { sourceId: "PMDA_DEVICE_SAFETY_NOTICES" },
      expect.objectContaining({ jobId: `${INGESTION_JOB_NAME}:PMDA_DEVICE_SAFETY_NOTICES` }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      INGESTION_JOB_NAME,
      { sourceId: "FDA_FEDERAL_REGISTER_DEVICE_NOTICES" },
      expect.objectContaining({
        jobId: `${INGESTION_JOB_NAME}:FDA_FEDERAL_REGISTER_DEVICE_NOTICES`,
      }),
    );
  });

  it("uses the INGESTION_CRON config value as the repeat pattern when set", async () => {
    const queue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;
    const config = {
      get: jest.fn().mockReturnValue("0 0 * * *"),
    } as unknown as jest.Mocked<ConfigService>;
    const sources = [makeSource("PMDA_DEVICE_SAFETY_NOTICES")];
    const scheduler = new IngestionScheduler(queue, config, sources);

    await scheduler.onModuleInit();

    expect(queue.add).toHaveBeenCalledWith(
      INGESTION_JOB_NAME,
      expect.anything(),
      expect.objectContaining({ repeat: { pattern: "0 0 * * *" } }),
    );
  });
});
