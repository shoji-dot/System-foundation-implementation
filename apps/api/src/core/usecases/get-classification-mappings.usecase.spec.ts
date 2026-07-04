import { NotFoundException } from "@nestjs/common";

import type { ClassificationMappingSummary } from "../domain/classification.entity";
import type { ClassificationRepository } from "../domain/classification.repository";

import { GetClassificationMappingsUsecase } from "./get-classification-mappings.usecase";

describe("GetClassificationMappingsUsecase", () => {
  const mapping: ClassificationMappingSummary = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e7a",
    confidence: 0.92,
    classification: {
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e7b",
      jurisdiction: { code: "US", name: "米国" },
      scheme: "FDA_PRODUCT_CODE",
      code: "ABC",
      name: "Flexible Endoscope",
      class: "II",
      definition: null,
      createdAt: new Date("2026-07-04T00:00:00.000Z"),
      updatedAt: new Date("2026-07-04T00:00:00.000Z"),
    },
  };

  function setup() {
    const classificationRepository: jest.Mocked<ClassificationRepository> = {
      findMany: jest.fn(),
      findMappingsByClassificationId: jest.fn(),
    };
    const usecase = new GetClassificationMappingsUsecase(classificationRepository);
    return { usecase, classificationRepository };
  }

  it("returns the mappings from the repository", async () => {
    const { usecase, classificationRepository } = setup();
    classificationRepository.findMappingsByClassificationId.mockResolvedValue([mapping]);

    const result = await usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a");

    expect(classificationRepository.findMappingsByClassificationId).toHaveBeenCalledWith(
      "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    );
    expect(result).toEqual([mapping]);
  });

  it("throws NotFoundException when the classification does not exist", async () => {
    const { usecase, classificationRepository } = setup();
    classificationRepository.findMappingsByClassificationId.mockResolvedValue(null);

    await expect(usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
