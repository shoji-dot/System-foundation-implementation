import { ConflictException, NotFoundException } from "@nestjs/common";

import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";

import { DeleteLifecycleTemplateUsecase } from "./delete-lifecycle-template.usecase";

describe("DeleteLifecycleTemplateUsecase", () => {
  function makeDetail(status: "DRAFT" | "PUBLISHED"): LifecycleTemplateDetail {
    return {
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
      jurisdiction: { code: "JP", name: "日本" },
      framework: "MEDICAL_DEVICE",
      deviceClass: "CLASS_II",
      productNovelty: null,
      approvalRoute: "認証",
      characteristics: [],
      status,
      version: 1,
      effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
      effectiveTo: null,
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
    const usecase = new DeleteLifecycleTemplateUsecase(lifecycleTemplateRepository);
    return { usecase, lifecycleTemplateRepository };
  }

  it("deletes a DRAFT template", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("DRAFT"));
    lifecycleTemplateRepository.delete.mockResolvedValue(true);

    await usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a");

    expect(lifecycleTemplateRepository.delete).toHaveBeenCalledWith(
      "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    );
  });

  it("throws NotFoundException when the template does not exist", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(null);

    await expect(usecase.execute("missing")).rejects.toBeInstanceOf(NotFoundException);
    expect(lifecycleTemplateRepository.delete).not.toHaveBeenCalled();
  });

  it("throws ConflictException when the template is already PUBLISHED", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("PUBLISHED"));

    await expect(usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(lifecycleTemplateRepository.delete).not.toHaveBeenCalled();
  });

  it("throws ConflictException on the defensive race re-check (repository returns false)", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("DRAFT"));
    lifecycleTemplateRepository.delete.mockResolvedValue(false);

    await expect(usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a")).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
