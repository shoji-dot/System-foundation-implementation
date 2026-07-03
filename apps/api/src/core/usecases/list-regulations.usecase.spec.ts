import type { Regulation } from "../domain/regulation.entity";
import type { RegulationRepository } from "../domain/regulation.repository";

import { ListRegulationsUsecase } from "./list-regulations.usecase";

describe("ListRegulationsUsecase", () => {
  const regulation: Regulation = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    jurisdiction: { code: "JP", name: "日本" },
    type: "LAW",
    subtype: null,
    title: "医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律",
    docNumber: "昭和三十五年法律第百四十五号",
    status: "ACTIVE",
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceUrl: null,
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    updatedAt: new Date("2026-07-04T00:00:00.000Z"),
  };

  function setup() {
    const regulationRepository: jest.Mocked<RegulationRepository> = {
      findMany: jest.fn(),
    };
    const usecase = new ListRegulationsUsecase(regulationRepository);
    return { usecase, regulationRepository };
  }

  it("normalizes filters and delegates to the repository", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findMany.mockResolvedValue({ items: [regulation], nextCursor: null });

    const result = await usecase.execute({
      jurisdiction: "JP",
      type: "LAW",
      q: "  医薬品  ",
      cursor: undefined,
      limit: 20,
    });

    expect(regulationRepository.findMany).toHaveBeenCalledWith({
      jurisdictionCode: "JP",
      type: "LAW",
      q: "医薬品",
      cursor: undefined,
      limit: 20,
    });
    expect(result.items).toEqual([regulation]);
    expect(result.nextCursor).toBeNull();
  });

  it("omits q entirely when it is blank after trimming", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findMany.mockResolvedValue({ items: [], nextCursor: null });

    await usecase.execute({ q: "   ", limit: 20 });

    expect(regulationRepository.findMany).toHaveBeenCalledWith({
      jurisdictionCode: undefined,
      type: undefined,
      q: undefined,
      cursor: undefined,
      limit: 20,
    });
  });
});
