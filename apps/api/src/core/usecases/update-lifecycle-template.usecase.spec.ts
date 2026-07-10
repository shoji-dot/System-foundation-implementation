import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";

import type { Jurisdiction } from "../domain/jurisdiction.entity";
import type { JurisdictionRepository } from "../domain/jurisdiction.repository";
import type { LifecyclePhase } from "../domain/lifecycle-phase.entity";
import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type {
  LifecycleTemplateRepository,
  LifecycleTemplateStepWriteInput,
} from "../domain/lifecycle-template.repository";

import { UpdateLifecycleTemplateUsecase } from "./update-lifecycle-template.usecase";

describe("UpdateLifecycleTemplateUsecase", () => {
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

  function makeDetail(status: "DRAFT" | "PUBLISHED"): LifecycleTemplateDetail {
    return {
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
      jurisdiction: { code: "JP", name: "日本" },
      deviceCategory: "CLASS_II",
      procedureType: "認証",
      status,
      version: 1,
      createdAt: new Date("2026-07-10T00:00:00.000Z"),
      steps: [],
    };
  }

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
    const usecase = new UpdateLifecycleTemplateUsecase(
      lifecycleTemplateRepository,
      jurisdictionRepository,
    );
    return { usecase, lifecycleTemplateRepository, jurisdictionRepository };
  }

  it("updates a DRAFT template after validating jurisdiction and phase codes", async () => {
    const { usecase, lifecycleTemplateRepository, jurisdictionRepository } = setup();
    const draft = makeDetail("DRAFT");
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(draft);
    jurisdictionRepository.findAll.mockResolvedValue([jpJurisdiction]);
    lifecycleTemplateRepository.findAllPhases.mockResolvedValue([submissionPhase]);
    lifecycleTemplateRepository.update.mockResolvedValue({ ...draft, procedureType: "承認" });

    const result = await usecase.execute({
      id: draft.id,
      jurisdictionCode: "JP",
      deviceCategory: "CLASS_II",
      procedureType: "  承認  ",
      steps: [step],
    });

    expect(lifecycleTemplateRepository.update).toHaveBeenCalledWith(draft.id, {
      jurisdictionCode: "JP",
      deviceCategory: "CLASS_II",
      procedureType: "承認",
      steps: [step],
    });
    expect(result.procedureType).toBe("承認");
  });

  it("throws NotFoundException when the template does not exist", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(null);

    await expect(
      usecase.execute({
        id: "missing",
        jurisdictionCode: "JP",
        deviceCategory: "CLASS_II",
        procedureType: "認証",
        steps: [step],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(lifecycleTemplateRepository.update).not.toHaveBeenCalled();
  });

  it("throws ConflictException when the template is already PUBLISHED", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("PUBLISHED"));

    await expect(
      usecase.execute({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        jurisdictionCode: "JP",
        deviceCategory: "CLASS_II",
        procedureType: "認証",
        steps: [step],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(lifecycleTemplateRepository.update).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when the jurisdiction is not registered", async () => {
    const { usecase, lifecycleTemplateRepository, jurisdictionRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("DRAFT"));
    jurisdictionRepository.findAll.mockResolvedValue([]);
    lifecycleTemplateRepository.findAllPhases.mockResolvedValue([submissionPhase]);

    await expect(
      usecase.execute({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        jurisdictionCode: "JP",
        deviceCategory: "CLASS_II",
        procedureType: "認証",
        steps: [step],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws ConflictException on the defensive race re-check (repository returns null)", async () => {
    const { usecase, lifecycleTemplateRepository, jurisdictionRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("DRAFT"));
    jurisdictionRepository.findAll.mockResolvedValue([jpJurisdiction]);
    lifecycleTemplateRepository.findAllPhases.mockResolvedValue([submissionPhase]);
    lifecycleTemplateRepository.update.mockResolvedValue(null);

    await expect(
      usecase.execute({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
        jurisdictionCode: "JP",
        deviceCategory: "CLASS_II",
        procedureType: "認証",
        steps: [step],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
