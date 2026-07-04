import { NotFoundException } from "@nestjs/common";

import type { RegulationVersionSummary } from "../domain/regulation-version.entity";
import type { RegulationRepository } from "../domain/regulation.repository";

import { ListRegulationVersionsUsecase } from "./list-regulation-versions.usecase";

describe("ListRegulationVersionsUsecase", () => {
  const versionSummary: RegulationVersionSummary = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    versionNo: 2,
    publishedAt: new Date("2026-02-01T00:00:00.000Z"),
    effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
    effectiveTo: null,
    summary: "改正概要",
    changeSummary: "第三条を改正",
  };

  function setup() {
    const regulationRepository: jest.Mocked<RegulationRepository> = {
      findMany: jest.fn(),
      findDetailById: jest.fn(),
      findVersions: jest.fn(),
      findVersionsForDiff: jest.fn(),
    };
    const usecase = new ListRegulationVersionsUsecase(regulationRepository);
    return { usecase, regulationRepository };
  }

  it("delegates to the repository and returns the paginated result", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findVersions.mockResolvedValue({
      items: [versionSummary],
      nextCursor: "1",
    });

    const result = await usecase.execute({
      regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
      cursor: undefined,
      limit: 20,
    });

    expect(regulationRepository.findVersions).toHaveBeenCalledWith(
      "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
      { cursor: undefined, limit: 20 },
    );
    expect(result.items).toEqual([versionSummary]);
    expect(result.nextCursor).toBe("1");
  });

  it("throws NotFoundException when the regulation does not exist", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findVersions.mockResolvedValue(null);

    await expect(
      usecase.execute({ regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a", limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
