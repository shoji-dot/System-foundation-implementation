import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { GetPendingReviewVersionDetailUsecase } from "../../core/usecases/get-pending-review-version-detail.usecase";
import { ListPendingReviewVersionsUsecase } from "../../core/usecases/list-pending-review-versions.usecase";
import { PublishRegulationVersionUsecase } from "../../core/usecases/publish-regulation-version.usecase";

import { IngestionReviewController } from "./ingestion-review.controller";

describe("IngestionReviewController", () => {
  let controller: IngestionReviewController;
  const listExecute = jest.fn();
  const detailExecute = jest.fn();
  const publishExecute = jest.fn();
  const actorId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f";
  const authenticatedRequest = {
    user: { userId: actorId, email: "editor@example.com", systemRole: "EDITOR", plan: "FREE" },
  } as AuthenticatedRequest;

  beforeEach(async () => {
    listExecute.mockReset();
    detailExecute.mockReset();
    publishExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionReviewController],
      providers: [
        { provide: ListPendingReviewVersionsUsecase, useValue: { execute: listExecute } },
        { provide: GetPendingReviewVersionDetailUsecase, useValue: { execute: detailExecute } },
        { provide: PublishRegulationVersionUsecase, useValue: { execute: publishExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(IngestionReviewController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs, formatting date fields as strings", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
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
            regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
            regulationTitle: "医療機器の製造販売に関する通知",
            jurisdiction: { code: "JP", name: "日本" },
            type: "NOTICE",
            status: "DRAFT",
            versionNo: 2,
            effectiveFrom: "2026-07-01",
            changeSummary: "本文の変更を検出しました（行数: 10→12、文字数: 200→230）。",
            createdAt: "2026-07-05T00:00:00.000Z",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      });
    });
  });

  describe("detail", () => {
    it("maps the usecase result to a detail response including the current published version", async () => {
      detailExecute.mockResolvedValue({
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
      });

      const result = await controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" });

      expect(detailExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c");
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        regulationTitle: "医療機器の製造販売に関する通知",
        jurisdiction: { code: "JP", name: "日本" },
        type: "NOTICE",
        status: "DRAFT",
        versionNo: 2,
        effectiveFrom: "2026-07-01",
        changeSummary: "本文の変更を検出しました（行数: 10→12、文字数: 200→230）。",
        createdAt: "2026-07-05T00:00:00.000Z",
        fullText: "改正後の本文...",
        currentPublished: {
          versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
          versionNo: 1,
          fullText: "改正前の本文...",
          effectiveFrom: "2026-01-01",
        },
      });
    });

    it("returns currentPublished as null for a brand-new regulation's first draft", async () => {
      detailExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        regulationTitle: "新規通知",
        jurisdiction: { code: "JP", name: "日本" },
        type: "NOTICE",
        status: "DRAFT",
        versionNo: 1,
        effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
        changeSummary: null,
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
        fullText: "本文...",
        currentPublished: null,
      });

      const result = await controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" });

      expect(result.currentPublished).toBeNull();
    });

    it("propagates NotFoundException from the usecase", async () => {
      detailExecute.mockRejectedValue(
        new NotFoundException("指定された校閲対象の版が見つかりません。"),
      );

      await expect(
        controller.detail({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("publish", () => {
    it("delegates to the usecase and maps the result to the publish response", async () => {
      publishExecute.mockResolvedValue({
        regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        versionNo: 2,
        publishedAt: new Date("2026-07-05T01:00:00.000Z"),
        effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
        regulationStatus: "AMENDED",
        closedPreviousVersion: {
          versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
          effectiveTo: new Date("2026-06-30T00:00:00.000Z"),
        },
      });
      const result = await controller.publish(
        { id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" },
        authenticatedRequest,
      );
      expect(publishExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c", actorId);
      expect(result).toEqual({
        regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        versionNo: 2,
        status: "PUBLISHED",
        publishedAt: "2026-07-05T01:00:00.000Z",
        effectiveFrom: "2026-07-01",
        regulationStatus: "AMENDED",
        closedPreviousVersion: {
          versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
          effectiveTo: "2026-06-30",
        },
      });
    });

    it("returns closedPreviousVersion as null when publishing the first version", async () => {
      publishExecute.mockResolvedValue({
        regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        versionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        versionNo: 1,
        publishedAt: new Date("2026-07-05T01:00:00.000Z"),
        effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
        regulationStatus: "ACTIVE",
        closedPreviousVersion: null,
      });
      const result = await controller.publish(
        { id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" },
        authenticatedRequest,
      );
      expect(result.closedPreviousVersion).toBeNull();
    });

    it("propagates NotFoundException from the usecase", async () => {
      publishExecute.mockRejectedValue(new NotFoundException("not found"));
      await expect(
        controller.publish({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" }, authenticatedRequest),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
