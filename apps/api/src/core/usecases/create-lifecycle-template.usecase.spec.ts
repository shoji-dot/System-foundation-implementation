import { BadRequestException } from "@nestjs/common";

import type { Jurisdiction } from "../domain/jurisdiction.entity";
import type { JurisdictionRepository } from "../domain/jurisdiction.repository";
import type { LifecyclePhase } from "../domain/lifecycle-phase.entity";
import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type {
  LifecycleTemplateRepository,
  LifecycleTemplateStepWriteInput,
} from "../domain/lifecycle-template.repository";

import { CreateLifecycleTemplateUsecase } from "./create-lifecycle-template.usecase";

describe("CreateLifecycleTemplateUsecase", () => {
  const jpJurisdiction: Jurisdiction = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    code: "JP",
    name: "日本",
    authority: "PMDA",
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    updatedAt: new Date("2026-07-04T00:00:00.000Z"),
  };

  const submissionPhase: LifecyclePhase = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    code: "SUBMISSION",
    name: "承認申請",
    order: 8,
  };

  const step: LifecycleTemplateStepWriteInput = {
    phaseCode: "SUBMISSION",
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
  };

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
    steps: [],
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
    const jurisdictionRepository: jest.Mocked<JurisdictionRepository> = {
      findAll: jest.fn(),
    };
    const usecase = new CreateLifecycleTemplateUsecase(
      lifecycleTemplateRepository,
      jurisdictionRepository,
    );
    return { usecase, lifecycleTemplateRepository, jurisdictionRepository };
  }

  it("creates a template as DRAFT after validating jurisdiction and phase codes", async () => {
    const { usecase, lifecycleTemplateRepository, jurisdictionRepository } = setup();
    jurisdictionRepository.findAll.mockResolvedValue([jpJurisdiction]);
    lifecycleTemplateRepository.findAllPhases.mockResolvedValue([submissionPhase]);
    lifecycleTemplateRepository.create.mockResolvedValue(detail);

    const result = await usecase.execute({
      jurisdictionCode: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      productNovelty: null,
      approvalRoute: "  認証  ",
      characteristics: ["SAMD"],
      effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
      effectiveTo: null,
      steps: [step],
    });

    expect(lifecycleTemplateRepository.create).toHaveBeenCalledWith({
      jurisdictionCode: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      productNovelty: null,
      approvalRoute: "認証",
      characteristics: ["SAMD"],
      effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
      effectiveTo: null,
      steps: [step],
    });
    expect(result).toEqual(detail);
  });

  it("rejects when the jurisdiction is not yet registered", async () => {
    const { usecase, lifecycleTemplateRepository, jurisdictionRepository } = setup();
    jurisdictionRepository.findAll.mockResolvedValue([]);
    lifecycleTemplateRepository.findAllPhases.mockResolvedValue([submissionPhase]);

    await expect(
      usecase.execute({
        jurisdictionCode: "JP",
        framework: "MEDICAL_DEVICE",
        deviceClass: "CLASS_II",
        productNovelty: null,
        approvalRoute: "認証",
        characteristics: [],
        effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
        effectiveTo: null,
        steps: [step],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(lifecycleTemplateRepository.create).not.toHaveBeenCalled();
  });

  it("rejects when a step references a phase code that is not seeded", async () => {
    const { usecase, lifecycleTemplateRepository, jurisdictionRepository } = setup();
    jurisdictionRepository.findAll.mockResolvedValue([jpJurisdiction]);
    lifecycleTemplateRepository.findAllPhases.mockResolvedValue([]);

    await expect(
      usecase.execute({
        jurisdictionCode: "JP",
        framework: "MEDICAL_DEVICE",
        deviceClass: "CLASS_II",
        productNovelty: null,
        approvalRoute: "認証",
        characteristics: [],
        effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
        effectiveTo: null,
        steps: [step],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(lifecycleTemplateRepository.create).not.toHaveBeenCalled();
  });
});
