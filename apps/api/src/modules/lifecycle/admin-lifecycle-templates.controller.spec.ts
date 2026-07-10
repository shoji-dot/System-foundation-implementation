import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { LifecycleTemplateDetail } from "../../core/domain/lifecycle-template.entity";
import { CreateLifecycleTemplateUsecase } from "../../core/usecases/create-lifecycle-template.usecase";
import { DeleteLifecycleTemplateUsecase } from "../../core/usecases/delete-lifecycle-template.usecase";
import { GetAdminLifecycleTemplateDetailUsecase } from "../../core/usecases/get-admin-lifecycle-template-detail.usecase";
import { ListAdminLifecycleTemplatesUsecase } from "../../core/usecases/list-admin-lifecycle-templates.usecase";
import { PublishLifecycleTemplateUsecase } from "../../core/usecases/publish-lifecycle-template.usecase";
import { UpdateLifecycleTemplateUsecase } from "../../core/usecases/update-lifecycle-template.usecase";

import { AdminLifecycleTemplatesController } from "./admin-lifecycle-templates.controller";

describe("AdminLifecycleTemplatesController", () => {
  let controller: AdminLifecycleTemplatesController;
  const createExecute = jest.fn();
  const updateExecute = jest.fn();
  const deleteExecute = jest.fn();
  const publishExecute = jest.fn();
  const listExecute = jest.fn();
  const detailExecute = jest.fn();
  const templateId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a";

  const detail: LifecycleTemplateDetail = {
    id: templateId,
    jurisdiction: { code: "JP", name: "日本" },
    framework: "MEDICAL_DEVICE",
    deviceClass: "CLASS_II",
    productNovelty: null,
    approvalRoute: "認証",
    characteristics: ["SAMD"],
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

  const stepRequest = {
    phaseCode: "SUBMISSION" as const,
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

  beforeEach(async () => {
    createExecute.mockReset();
    updateExecute.mockReset();
    deleteExecute.mockReset();
    publishExecute.mockReset();
    listExecute.mockReset();
    detailExecute.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminLifecycleTemplatesController],
      providers: [
        { provide: CreateLifecycleTemplateUsecase, useValue: { execute: createExecute } },
        { provide: UpdateLifecycleTemplateUsecase, useValue: { execute: updateExecute } },
        { provide: DeleteLifecycleTemplateUsecase, useValue: { execute: deleteExecute } },
        { provide: PublishLifecycleTemplateUsecase, useValue: { execute: publishExecute } },
        { provide: ListAdminLifecycleTemplatesUsecase, useValue: { execute: listExecute } },
        {
          provide: GetAdminLifecycleTemplateDetailUsecase,
          useValue: { execute: detailExecute },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminLifecycleTemplatesController);
  });

  it("create: delegates to the usecase and returns the created template", async () => {
    createExecute.mockResolvedValue(detail);

    const result = await controller.create({
      jurisdiction: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      productNovelty: null,
      approvalRoute: "認証",
      characteristics: ["SAMD"],
      effectiveFrom: "2026-07-01",
      effectiveTo: null,
      steps: [stepRequest],
    });

    expect(createExecute).toHaveBeenCalledWith({
      jurisdictionCode: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      productNovelty: null,
      approvalRoute: "認証",
      characteristics: ["SAMD"],
      effectiveFrom: new Date("2026-07-01"),
      effectiveTo: null,
      steps: [stepRequest],
    });
    expect(result.id).toBe(templateId);
    expect(result.steps[0]!.durationMinDays).toBe(30);
  });

  it("update: delegates to the usecase with the param id and body fields", async () => {
    updateExecute.mockResolvedValue({ ...detail, approvalRoute: "承認" });

    const result = await controller.update(
      { id: templateId },
      {
        jurisdiction: "JP",
        framework: "MEDICAL_DEVICE",
        deviceClass: "CLASS_II",
        productNovelty: null,
        approvalRoute: "承認",
        characteristics: ["SAMD"],
        effectiveFrom: "2026-07-01",
        effectiveTo: null,
        steps: [stepRequest],
      },
    );

    expect(updateExecute).toHaveBeenCalledWith({
      id: templateId,
      jurisdictionCode: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      productNovelty: null,
      approvalRoute: "承認",
      characteristics: ["SAMD"],
      effectiveFrom: new Date("2026-07-01"),
      effectiveTo: null,
      steps: [stepRequest],
    });
    expect(result.approvalRoute).toBe("承認");
  });

  it("remove: delegates to the usecase with the param id", async () => {
    deleteExecute.mockResolvedValue(undefined);

    await controller.remove({ id: templateId });

    expect(deleteExecute).toHaveBeenCalledWith(templateId);
  });

  it("publish: delegates to the usecase and returns the published template", async () => {
    publishExecute.mockResolvedValue({ ...detail, status: "PUBLISHED" });

    const result = await controller.publish({ id: templateId });

    expect(publishExecute).toHaveBeenCalledWith(templateId);
    expect(result.status).toBe("PUBLISHED");
  });

  it("list: delegates filters to the usecase", async () => {
    listExecute.mockResolvedValue({
      items: [
        {
          id: templateId,
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
        },
      ],
      nextCursor: null,
    });

    const result = await controller.list({
      jurisdiction: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      approvalRoute: "認証",
      status: "DRAFT",
      limit: 20,
    });

    expect(listExecute).toHaveBeenCalledWith({
      jurisdiction: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      approvalRoute: "認証",
      status: "DRAFT",
      cursor: undefined,
      limit: 20,
    });
    expect(result.items).toHaveLength(1);
  });

  it("detail: delegates to the usecase with the param id", async () => {
    detailExecute.mockResolvedValue(detail);

    const result = await controller.detail({ id: templateId });

    expect(detailExecute).toHaveBeenCalledWith(templateId);
    expect(result.id).toBe(templateId);
  });
});
