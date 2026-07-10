import type { LifecycleTemplate } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";

import { ListAdminLifecycleTemplatesUsecase } from "./list-admin-lifecycle-templates.usecase";

describe("ListAdminLifecycleTemplatesUsecase", () => {
  const template: LifecycleTemplate = {
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
    const usecase = new ListAdminLifecycleTemplatesUsecase(lifecycleTemplateRepository);
    return { usecase, lifecycleTemplateRepository };
  }

  it("delegates filters (including status) to the repository, covering all statuses", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findManyForAdmin.mockResolvedValue({
      items: [template],
      nextCursor: null,
    });

    const result = await usecase.execute({
      jurisdiction: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      approvalRoute: "認証",
      status: "DRAFT",
      cursor: undefined,
      limit: 20,
    });

    expect(lifecycleTemplateRepository.findManyForAdmin).toHaveBeenCalledWith({
      jurisdictionCode: "JP",
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      approvalRoute: "認証",
      status: "DRAFT",
      cursor: undefined,
      limit: 20,
    });
    expect(result).toEqual({ items: [template], nextCursor: null });
  });
});
