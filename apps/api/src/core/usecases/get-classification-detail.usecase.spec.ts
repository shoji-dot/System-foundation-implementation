import { NotFoundException } from "@nestjs/common";

import type { Classification } from "../domain/classification.entity";
import type { ClassificationRepository } from "../domain/classification.repository";

import { GetClassificationDetailUsecase } from "./get-classification-detail.usecase";

describe("GetClassificationDetailUsecase", () => {
  const classification: Classification = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    jurisdiction: { code: "JP", name: "日本" },
    scheme: "JMDN",
    code: "35282000",
    name: "汎用電子内視鏡",
    class: "III",
    definition: "体腔内又は体内管腔内を観察するために用いる電子内視鏡。",
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    updatedAt: new Date("2026-07-04T00:00:00.000Z"),
  };

  function setup() {
    const classificationRepository: jest.Mocked<ClassificationRepository> = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findMappingsByClassificationId: jest.fn(),
    };
    const usecase = new GetClassificationDetailUsecase(classificationRepository);
    return { usecase, classificationRepository };
  }

  it("returns the classification from the repository", async () => {
    const { usecase, classificationRepository } = setup();
    classificationRepository.findById.mockResolvedValue(classification);

    const result = await usecase.execute(classification.id);

    expect(classificationRepository.findById).toHaveBeenCalledWith(classification.id);
    expect(result).toEqual(classification);
  });

  it("throws NotFoundException when the classification does not exist", async () => {
    const { usecase, classificationRepository } = setup();
    classificationRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute(classification.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
