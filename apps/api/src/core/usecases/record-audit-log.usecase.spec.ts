import type { AuditLogRepository } from "../domain/audit-log.repository";

import { RecordAuditLogUsecase } from "./record-audit-log.usecase";

describe("RecordAuditLogUsecase", () => {
  function setup() {
    const auditLogRepository: jest.Mocked<AuditLogRepository> = {
      create: jest.fn(),
      list: jest.fn(),
    };
    const usecase = new RecordAuditLogUsecase(auditLogRepository);
    return { usecase, auditLogRepository };
  }

  it("delegates to the repository with the given fields", async () => {
    const { usecase, auditLogRepository } = setup();
    const expected = {
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      actorId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      action: "regulation_version.publish",
      target: "regulation_version:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
      createdAt: new Date("2026-07-07T00:00:00.000Z"),
    };
    auditLogRepository.create.mockResolvedValue(expected);

    const result = await usecase.execute({
      actorId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      action: "regulation_version.publish",
      target: "regulation_version:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
    });

    expect(auditLogRepository.create).toHaveBeenCalledWith({
      actorId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      action: "regulation_version.publish",
      target: "regulation_version:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
    });
    expect(result).toEqual(expected);
  });

  it("allows a null actorId for system-initiated actions (e.g. ingestion pipeline)", async () => {
    const { usecase, auditLogRepository } = setup();
    const expected = {
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f",
      actorId: null,
      action: "ingestion_job.run",
      target: "ingestion_job:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e60",
      createdAt: new Date("2026-07-07T00:00:00.000Z"),
    };
    auditLogRepository.create.mockResolvedValue(expected);

    const result = await usecase.execute({
      actorId: null,
      action: "ingestion_job.run",
      target: "ingestion_job:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e60",
    });

    expect(result.actorId).toBeNull();
  });
});
