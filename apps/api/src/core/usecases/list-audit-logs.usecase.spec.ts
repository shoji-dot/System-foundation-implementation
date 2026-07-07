import type { AuditLogRepository } from "../domain/audit-log.repository";

import { ListAuditLogsUsecase } from "./list-audit-logs.usecase";

describe("ListAuditLogsUsecase", () => {
  function setup() {
    const auditLogRepository: jest.Mocked<AuditLogRepository> = {
      create: jest.fn(),
      list: jest.fn(),
    };
    const usecase = new ListAuditLogsUsecase(auditLogRepository);
    return { usecase, auditLogRepository };
  }

  it("delegates to the repository with the given cursor and limit", async () => {
    const { usecase, auditLogRepository } = setup();
    const expected = {
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          actorId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
          action: "regulation_version.publish",
          target: "regulation_version:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
        },
      ],
      nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    };
    auditLogRepository.list.mockResolvedValue(expected);

    const result = await usecase.execute({ cursor: "some-cursor", limit: 20 });

    expect(auditLogRepository.list).toHaveBeenCalledWith({ cursor: "some-cursor", limit: 20 });
    expect(result).toEqual(expected);
  });

  it("works without a cursor for the first page", async () => {
    const { usecase, auditLogRepository } = setup();
    auditLogRepository.list.mockResolvedValue({ items: [], nextCursor: null });

    const result = await usecase.execute({ limit: 20 });

    expect(auditLogRepository.list).toHaveBeenCalledWith({ limit: 20 });
    expect(result).toEqual({ items: [], nextCursor: null });
  });
});
