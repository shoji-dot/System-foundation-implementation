import { NotFoundException } from "@nestjs/common";

import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";

import { GetAdminLifecycleTemplateDetailUsecase } from "./get-admin-lifecycle-template-detail.usecase";

describe("GetAdminLifecycleTemplateDetailUsecase", () => {
  const detail: LifecycleTemplateDetail = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    jurisdiction: { code: "JP", name: "日本" },
    framework: "MEDICAL_DEVICE",
    deviceClass: "CLASS_II",
    productNovelty: null,
    approvalRoute: "認証",
    characteristics: [],
    status: "DRAFT",
    version: 1,
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    effectiveTo: null,
    createdAt: new Date("2026-07-10T00:00:00.000Z"),
    steps: [
      {
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        phase: {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          code: "SUBMISSION",
          name: "承認申請",
          order: 8,
        },
        name: "認証申請書の提出",
        order: 1,
        durationMinDays: 30,
        durationMaxDays: 60,
        costMinJpy: 500000,
        costMaxJpy: 1000000,
        requiredDocuments: ["認証申請書"],
        requiredTests: [],
        relatedRegulationIds: [],
        pmdaResourceUrls: [],
        notes: null,
        sourceRefs: [{ title: "薬機法施行規則", url: "https://example.com/law" }],
      },
    ],
  };

  function setup() {
    const lifecycleTemplateRepository: jest.Mocked<LifecycleTemplateRepository> = {
      findManyPublished: jest.fn(),
      findPublishedDetailById: jest.fn(),
      findManyForAdmin: jest.fn(),
      findDetailByIdForAdmin: jest.fn(),
      findAllPhases: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      publish: jest.fn(),
    };
    const usecase = new GetAdminLifecycleTemplateDetailUsecase(lifecycleTemplateRepository);
    return { usecase, lifecycleTemplateRepository };
  }

  it("returns the unmasked detail regardless of plan (admin/editor view)", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(detail);

    const result = await usecase.execute(detail.id);

    expect(result).toEqual(detail);
    expect(result.steps[0]!.durationMinDays).toBe(30);
  });

  it("throws NotFoundException when the template does not exist", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(null);

    await expect(usecase.execute("missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});
