import { NotFoundException } from "@nestjs/common";

import type { RegulationVersion } from "../domain/regulation-version.entity";
import type { RegulationRepository } from "../domain/regulation.repository";

import { GetRegulationDiffUsecase } from "./get-regulation-diff.usecase";

describe("GetRegulationDiffUsecase", () => {
  const regulationId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a";

  const fromVersion: RegulationVersion = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    versionNo: 1,
    publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveTo: new Date("2026-01-31T00:00:00.000Z"),
    fullText: "第一条 ...\n第二条 ...",
    summary: null,
    changeSummary: null,
    sections: [
      { id: "s1", path: "第一条", heading: "目的", body: "旧目的の本文" },
      { id: "s2", path: "第二条", heading: "定義", body: "共通の本文" },
    ],
  };

  const toVersion: RegulationVersion = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
    versionNo: 2,
    publishedAt: new Date("2026-02-01T00:00:00.000Z"),
    effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
    effectiveTo: null,
    fullText: "第一条 ...\n第二条 ...\n第三条 ...",
    summary: "改正概要",
    changeSummary: "第一条を改正し第三条を新設",
    sections: [
      { id: "s1v2", path: "第一条", heading: "目的", body: "新目的の本文" },
      { id: "s2v2", path: "第二条", heading: "定義", body: "共通の本文" },
      { id: "s3v2", path: "第三条", heading: "責務", body: "新設の本文" },
    ],
  };

  function setup() {
    const regulationRepository: jest.Mocked<RegulationRepository> = {
      findMany: jest.fn(),
      findDetailById: jest.fn(),
      findVersions: jest.fn(),
      findVersionsForDiff: jest.fn(),
    };
    const usecase = new GetRegulationDiffUsecase(regulationRepository);
    return { usecase, regulationRepository };
  }

  it("classifies sections as modified/unchanged/added by matching path", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findVersionsForDiff.mockResolvedValue({
      from: fromVersion,
      to: toVersion,
    });

    const result = await usecase.execute({ regulationId, from: 1, to: 2 });

    expect(regulationRepository.findVersionsForDiff).toHaveBeenCalledWith(regulationId, 1, 2);
    expect(result.regulationId).toBe(regulationId);
    expect(result.from).toEqual({
      id: fromVersion.id,
      versionNo: 1,
      publishedAt: fromVersion.publishedAt,
      effectiveFrom: fromVersion.effectiveFrom,
      effectiveTo: fromVersion.effectiveTo,
      summary: null,
      changeSummary: null,
    });
    expect(result.to.versionNo).toBe(2);
    expect(result.sections).toEqual([
      {
        path: "第一条",
        heading: "目的",
        status: "modified",
        fromBody: "旧目的の本文",
        toBody: "新目的の本文",
      },
      {
        path: "第二条",
        heading: "定義",
        status: "unchanged",
        fromBody: "共通の本文",
        toBody: "共通の本文",
      },
      {
        path: "第三条",
        heading: "責務",
        status: "added",
        fromBody: null,
        toBody: "新設の本文",
      },
    ]);
  });

  it("classifies a from-only section as removed", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findVersionsForDiff.mockResolvedValue({
      from: fromVersion,
      to: { ...toVersion, sections: [fromVersion.sections[1]!] },
    });

    const result = await usecase.execute({ regulationId, from: 1, to: 2 });

    expect(result.sections).toEqual([
      {
        path: "第一条",
        heading: "目的",
        status: "removed",
        fromBody: "旧目的の本文",
        toBody: null,
      },
      {
        path: "第二条",
        heading: "定義",
        status: "unchanged",
        fromBody: "共通の本文",
        toBody: "共通の本文",
      },
    ]);
  });

  it("throws NotFoundException when the regulation or either version does not exist", async () => {
    const { usecase, regulationRepository } = setup();
    regulationRepository.findVersionsForDiff.mockResolvedValue(null);

    await expect(usecase.execute({ regulationId, from: 1, to: 99 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
