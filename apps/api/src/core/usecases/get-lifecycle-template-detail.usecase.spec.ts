import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";

import { GetLifecycleTemplateDetailUsecase } from "./get-lifecycle-template-detail.usecase";

describe("GetLifecycleTemplateDetailUsecase", () => {
  const detail: LifecycleTemplateDetail = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5a",
    jurisdiction: { code: "JP", name: "日本" },
    framework: "MEDICAL_DEVICE",
    deviceClass: "CLASS_II",
    productNovelty: null,
    approvalRoute: "認証",
    characteristics: [],
    status: "PUBLISHED",
    version: 1,
    effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
    effectiveTo: null,
    createdAt: new Date("2026-07-10T00:00:00.000Z"),
    steps: [
      {
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        phase: {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          code: "SUBMISSION",
          name: "申請",
          order: 8,
        },
        name: "認証申請書の提出",
        order: 1,
        durationMinDays: 30,
        durationMaxDays: 60,
        costMinJpy: 500000,
        costMaxJpy: 1000000,
        requiredDocuments: ["認証申請書", "添付資料"],
        requiredTests: ["生物学的安全性試験"],
        relatedRegulationIds: ["018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d"],
        pmdaResourceUrls: ["https://www.pmda.go.jp/example"],
        notes: "備考",
        sourceRefs: [{ title: "薬機法施行規則", url: "https://example.com/law" }],
      },
    ],
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
    const usecase = new GetLifecycleTemplateDetailUsecase(lifecycleTemplateRepository);
    return { usecase, lifecycleTemplateRepository };
  }

  it("returns the full detail for a paying plan", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findPublishedDetailById.mockResolvedValue(detail);

    const result = await usecase.execute({ id: detail.id, plan: "PRO" });

    expect(result).toEqual(detail);
  });

  it("masks the practical detail fields for FREE, keeping the phase/name/order skeleton", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findPublishedDetailById.mockResolvedValue(detail);

    const result = await usecase.execute({ id: detail.id, plan: "FREE" });

    expect(result.steps[0]).toEqual({
      id: detail.steps[0]!.id,
      phase: detail.steps[0]!.phase,
      name: detail.steps[0]!.name,
      order: detail.steps[0]!.order,
      durationMinDays: null,
      durationMaxDays: null,
      costMinJpy: null,
      costMaxJpy: null,
      requiredDocuments: null,
      requiredTests: null,
      relatedRegulationIds: null,
      pmdaResourceUrls: null,
      notes: null,
      sourceRefs: null,
    });
  });

  it("throws 404 when the template does not exist or is not published", async () => {
    const { usecase, lifecycleTemplateRepository } = setup();
    lifecycleTemplateRepository.findPublishedDetailById.mockResolvedValue(null);

    await expect(usecase.execute({ id: detail.id, plan: "PRO" })).rejects.toThrow(
      "指定された工程マスタが見つからないか、未公開です。",
    );
  });
});
