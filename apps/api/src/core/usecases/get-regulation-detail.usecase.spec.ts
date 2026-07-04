import { NotFoundException } from "@nestjs/common";

import type { RegulationDetail } from "../domain/regulation.entity";
import type { RegulationRepository } from "../domain/regulation.repository";

import { GetRegulationDetailUsecase } from "./get-regulation-detail.usecase";

describe("GetRegulationDetailUsecase", () => {
  const detail: RegulationDetail = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    jurisdiction: { code: "JP", name: "日本" },
    type: "LAW",
    subtype: null,
    title: "医薬品医療機器等法",
    docNumber: "昭和三十五年法律第百四十五号",
    status: "ACTIVE",
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceUrl: null,
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    updatedAt: new Date("2026-07-04T00:00:00.000Z"),
    latestVersion: {
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      versionNo: 1,
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
      fullText: "第一条 この法律は...",
      summary: null,
      changeSummary: null,
      sections: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
          path: "第一条",
          heading: "目的",
          body: "...",
        },
      ],
    },
  };

  function setup() {
    const regulationRepository: jest.Mocked<RegulationRepository> = {
      findMany: jest.fn(),
      findDetailById: jest.fn(),
      findVersions: jest.fn(),
      findVersionsForDiff: jest.fn(),
    };
    const usecase = new GetRegulationDetailUsecase(regulationRepository);
    return { usecase, regulationRepository };
  }

  it("returns the regulation detail from the repository", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findDetailById.mockResolvedValue(detail);

    const result = await usecase.execute(detail.id);

    expect(regulationRepository.findDetailById).toHaveBeenCalledWith(detail.id);
    expect(result).toEqual(detail);
  });

  it("throws NotFoundException when the regulation does not exist", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findDetailById.mockResolvedValue(null);

    await expect(usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
