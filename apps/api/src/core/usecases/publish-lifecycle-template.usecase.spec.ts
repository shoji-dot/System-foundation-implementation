import { ConflictException, NotFoundException } from "@nestjs/common";

import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";

import { PublishLifecycleTemplateUsecase } from "./publish-lifecycle-template.usecase";

describe("PublishLifecycleTemplateUsecase", () => {
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
    const usecase = new PublishLifecycleTemplateUsecase(lifecycleTemplateRepository);
    return { usecase, lifecycleTemplateRepository };
  }

  it("publishes a DRAFT template", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("DRAFT"));
    lifecycleTemplateRepository.publish.mockResolvedValue(makeDetail("PUBLISHED"));

    const result = await usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a");

    expect(lifecycleTemplateRepository.publish).toHaveBeenCalledWith(
      "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    );
    expect(result.status).toBe("PUBLISHED");
  });

  it("throws NotFoundException when the template does not exist", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(null);

    await expect(usecase.execute("missing")).rejects.toBeInstanceOf(NotFoundException);
    expect(lifecycleTemplateRepository.publish).not.toHaveBeenCalled();
  });

  it("throws ConflictException when the template is already PUBLISHED", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("PUBLISHED"));

    await expect(usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(lifecycleTemplateRepository.publish).not.toHaveBeenCalled();
  });

  it("throws ConflictException on the defensive race re-check (repository returns null)", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findDetailByIdForAdmin.mockResolvedValue(makeDetail("DRAFT"));
    lifecycleTemplateRepository.publish.mockResolvedValue(null);

    await expect(usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a")).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
