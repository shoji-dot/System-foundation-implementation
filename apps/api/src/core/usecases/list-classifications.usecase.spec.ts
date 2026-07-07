import type { Classification } from "../domain/classification.entity";
import type { ClassificationRepository } from "../domain/classification.repository";

import { ListClassificationsUsecase } from "./list-classifications.usecase";

describe("ListClassificationsUsecase", () => {
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
    const usecase = new ListClassificationsUsecase(classificationRepository);
    return { usecase, classificationRepository };
  }

  it("normalizes filters and delegates to the repository", async () => {
    const { usecase, classificationRepository } = setup();
    classificationRepository.findMany.mockResolvedValue({
      items: [classification],
      nextCursor: null,
    });

    const result = await usecase.execute({
      scheme: "JMDN",
      jurisdiction: "JP",
      q: "  内視鏡  ",
      cursor: undefined,
      limit: 20,
    });

    expect(classificationRepository.findMany).toHaveBeenCalledWith({
      scheme: "JMDN",
      jurisdictionCode: "JP",
      q: "内視鏡",
      cursor: undefined,
      limit: 20,
    });
    expect(result.items).toEqual([classification]);
    expect(result.nextCursor).toBeNull();
  });

  it("omits q entirely when it is blank after trimming", async () => {
    const { usecase, classificationRepository } = setup();
    classificationRepository.findMany.mockResolvedValue({ items: [], nextCursor: null });

    await usecase.execute({ q: "   ", limit: 20 });

    expect(classificationRepository.findMany).toHaveBeenCalledWith({
      scheme: undefined,
      jurisdictionCode: undefined,
      q: undefined,
      cursor: undefined,
      limit: 20,
    });
  });
});
