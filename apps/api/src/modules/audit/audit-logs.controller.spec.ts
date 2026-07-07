import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ListAuditLogsUsecase } from "../../core/usecases/list-audit-logs.usecase";

import { AuditLogsController } from "./audit-logs.controller";

describe("AuditLogsController", () => {
  let controller: AuditLogsController;
  const listExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [{ provide: ListAuditLogsUsecase, useValue: { execute: listExecute } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuditLogsController);
  });

  it("maps the usecase result to response DTOs, formatting createdAt as an ISO string", async () => {
    listExecute.mockResolvedValue({
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
    });

    const result = await controller.list({ cursor: undefined, limit: 20 });

    expect(listExecute).toHaveBeenCalledWith({ cursor: undefined, limit: 20 });
    expect(result).toEqual({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          actorId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
          action: "regulation_version.publish",
          target: "regulation_version:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
          createdAt: "2026-07-07T00:00:00.000Z",
        },
      ],
      nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    });
  });

  it("returns actorId as null for system-initiated actions", async () => {
    listExecute.mockResolvedValue({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f",
          actorId: null,
          action: "ingestion_job.run",
          target: "ingestion_job:018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e60",
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
        },
      ],
      nextCursor: null,
    });

    const result = await controller.list({ cursor: undefined, limit: 20 });

    expect(result.items[0]?.actorId).toBeNull();
    expect(result.nextCursor).toBeNull();
  });

  it("returns an empty list when there are no audit logs", async () => {
    listExecute.mockResolvedValue({ items: [], nextCursor: null });

    const result = await controller.list({ cursor: undefined, limit: 20 });

    expect(result).toEqual({ items: [], nextCursor: null });
  });
});
