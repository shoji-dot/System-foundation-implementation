import type { ProjectRoadmapDetail } from "../domain/project-roadmap.entity";
import type { ProjectRoadmapRepository } from "../domain/project-roadmap.repository";
import type { ProjectRepository } from "../domain/project.repository";

import { GetProjectRoadmapUsecase } from "./get-project-roadmap.usecase";

describe("GetProjectRoadmapUsecase", () => {
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
  const roadmap: ProjectRoadmapDetail = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
    projectId: project.id,
    templateId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5e",
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
    const usecase = new GetProjectRoadmapUsecase(projectRepository, projectRoadmapRepository);
    return { usecase, projectRepository, projectRoadmapRepository };
  }

  it("returns the roadmap when the project belongs to the requesting user", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(roadmap);

    const result = await usecase.execute({ userId, projectId: project.id });

    expect(projectRepository.findByIdForUser).toHaveBeenCalledWith(project.id, userId);
    expect(projectRoadmapRepository.findDetailByProjectId).toHaveBeenCalledWith(project.id);
    expect(result).toEqual(roadmap);
  });

  it("throws NotFoundException when the project does not belong to the requesting user", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(null);

    await expect(usecase.execute({ userId, projectId: project.id })).rejects.toThrow(
      "指定されたプロジェクトが見つかりません。",
    );
    expect(projectRoadmapRepository.findDetailByProjectId).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when no roadmap has been generated yet", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(null);

    await expect(usecase.execute({ userId, projectId: project.id })).rejects.toThrow(
      "指定されたプロジェクトにロードマップが生成されていません。",
    );
  });
});
