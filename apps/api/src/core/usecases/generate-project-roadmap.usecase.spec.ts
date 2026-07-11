import type { LifecycleTemplateDetail } from "../domain/lifecycle-template.entity";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";
import type { ProjectRoadmapDetail } from "../domain/project-roadmap.entity";
import type { ProjectRoadmapRepository } from "../domain/project-roadmap.repository";
import type { ProjectRepository } from "../domain/project.repository";

import { GenerateProjectRoadmapUsecase } from "./generate-project-roadmap.usecase";

describe("GenerateProjectRoadmapUsecase", () => {
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";
  const project = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    name: "新規体外診断用医薬品の510k申請",
    deviceClass: "クラスII",
    targetJurisdictions: ["US" as const],
    organizationId: null,
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
    updatedAt: new Date("2026-07-05T00:00:00.000Z"),
  };
  const template: LifecycleTemplateDetail = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5e",
    jurisdiction: { code: "JP", name: "日本" },
    framework: "MEDICAL_DEVICE",
    deviceClass: "CLASS_II",
    productNovelty: "NEW",
    approvalRoute: "認証",
    characteristics: [],
    status: "PUBLISHED",
    version: 1,
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveTo: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    steps: [
      {
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e01",
        phase: { id: "phase-1", code: "PLANNING", name: "企画", order: 0 },
        name: "企画工程",
        order: 0,
        durationMinDays: 30,
        durationMaxDays: 60,
        costMinJpy: 0,
        costMaxJpy: 100_000,
        requiredDocuments: [],
        requiredTests: [],
        relatedRegulationIds: [],
        pmdaResourceUrls: [],
        notes: null,
        sourceRefs: [{ title: "出典", url: "https://example.com" }],
      },
    ],
  };
  const roadmap: ProjectRoadmapDetail = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
    projectId: project.id,
    templateId: template.id,
    generatedAt: new Date("2026-07-11T00:00:00.000Z"),
    aiAdjustments: null,
    status: "ACTIVE",
    createdAt: new Date("2026-07-11T00:00:00.000Z"),
    updatedAt: new Date("2026-07-11T00:00:00.000Z"),
    steps: [],
  };

  function setup() {
    const projectRepository: jest.Mocked<ProjectRepository> = {
      findManyForUser: jest.fn(),
      create: jest.fn(),
      findByIdForUser: jest.fn(),
      countForUser: jest.fn(),
    };
    const projectRoadmapRepository: jest.Mocked<ProjectRoadmapRepository> = {
      create: jest.fn(),
      findDetailByProjectId: jest.fn(),
      findStepByIdForRoadmap: jest.fn(),
      updateStep: jest.fn(),
      countForUser: jest.fn(),
    };
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
    const usecase = new GenerateProjectRoadmapUsecase(
      projectRepository,
      projectRoadmapRepository,
      lifecycleTemplateRepository,
    );
    return { usecase, projectRepository, projectRoadmapRepository, lifecycleTemplateRepository };
  }

  it("generates a roadmap by copying the published template's steps", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, lifecycleTemplateRepository } =
      setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.countForUser.mockResolvedValue(0);
    lifecycleTemplateRepository.findPublishedDetailById.mockResolvedValue(template);
    projectRoadmapRepository.create.mockResolvedValue(roadmap);

    const result = await usecase.execute({
      userId,
      plan: "PRO",
      projectId: project.id,
      templateId: template.id,
    });

    expect(projectRepository.findByIdForUser).toHaveBeenCalledWith(project.id, userId);
    expect(lifecycleTemplateRepository.findPublishedDetailById).toHaveBeenCalledWith(template.id);
    expect(projectRoadmapRepository.create).toHaveBeenCalledWith({
      projectId: project.id,
      templateId: template.id,
      generatedAt: expect.any(Date) as Date,
      templateStepIds: [template.steps[0]!.id],
    });
    expect(result).toEqual(roadmap);
  });

  it("throws NotFoundException when the project does not belong to the requesting user", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, plan: "PRO", projectId: project.id, templateId: template.id }),
    ).rejects.toThrow("指定されたプロジェクトが見つかりません。");
    expect(projectRoadmapRepository.create).not.toHaveBeenCalled();
  });

  it("throws Forbidden for the FREE plan (view-only)", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, lifecycleTemplateRepository } =
      setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.countForUser.mockResolvedValue(0);

    // HttpException(response, status)はresponseにmessageキーが無いと.messageが固定文字列
    // "Http Exception"になる（CreateProjectUsecaseと同じRFC9457方式のため.rejects.toThrow(文字列)は使えない、
    // create-project.usecase.spec.tsと同じ検証方法に合わせる）。
    const error: unknown = await usecase
      .execute({ userId, plan: "FREE", projectId: project.id, templateId: template.id })
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 403 });
    expect((error as { getResponse: () => { detail: string } }).getResponse().detail).toContain(
      "ロードマップの生成はPro以上のプランでご利用いただけます。",
    );
    expect(lifecycleTemplateRepository.findPublishedDetailById).not.toHaveBeenCalled();
  });

  it("throws Forbidden for the PRO plan once the 3-roadmap limit is reached", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.countForUser.mockResolvedValue(3);

    const error: unknown = await usecase
      .execute({ userId, plan: "PRO", projectId: project.id, templateId: template.id })
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 403 });
    expect((error as { getResponse: () => { detail: string } }).getResponse().detail).toContain(
      "上限（3件）に達しています",
    );
  });

  it("throws NotFoundException when the template does not exist or is not published", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, lifecycleTemplateRepository } =
      setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.countForUser.mockResolvedValue(0);
    lifecycleTemplateRepository.findPublishedDetailById.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, plan: "PRO", projectId: project.id, templateId: template.id }),
    ).rejects.toThrow("指定された工程マスタが見つからないか、未公開です。");
    expect(projectRoadmapRepository.create).not.toHaveBeenCalled();
  });

  it("throws ConflictException when the project already has a roadmap", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, lifecycleTemplateRepository } =
      setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.countForUser.mockResolvedValue(0);
    lifecycleTemplateRepository.findPublishedDetailById.mockResolvedValue(template);
    projectRoadmapRepository.create.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, plan: "PRO", projectId: project.id, templateId: template.id }),
    ).rejects.toThrow("このプロジェクトには既にロードマップが生成されています。");
  });
});
