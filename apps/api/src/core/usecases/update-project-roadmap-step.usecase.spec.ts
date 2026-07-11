import type { ProjectRoadmapDetail, ProjectRoadmapStepDetail } from "../domain/project-roadmap.entity";
import type { ProjectRoadmapRepository } from "../domain/project-roadmap.repository";
import type { ProjectRepository } from "../domain/project.repository";
import type { UserRepository } from "../domain/user.repository";

import { UpdateProjectRoadmapStepUsecase } from "./update-project-roadmap-step.usecase";

describe("UpdateProjectRoadmapStepUsecase", () => {
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";
  const assigneeId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f";
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
  const step = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e01",
    roadmapId: roadmap.id,
    templateStepId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e02",
    status: "TODO" as const,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    assigneeId: null,
    createdAt: new Date("2026-07-11T00:00:00.000Z"),
    updatedAt: new Date("2026-07-11T00:00:00.000Z"),
  };
  const updatedStep: ProjectRoadmapStepDetail = {
    ...step,
    status: "IN_PROGRESS",
    assigneeId,
    templateStep: {
      id: step.templateStepId,
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
      sourceRefs: [],
    },
  };
  const assigneeUser = {
    id: assigneeId,
    email: "tanaka@example.com",
    passwordHash: null,
    name: "田中",
    locale: "ja",
    systemRole: "USER" as const,
    plan: "PRO" as const,
    profession: "REGULATORY" as const,
    interestedJurisdictions: [],
    onboardingCompletedAt: new Date("2026-07-01T00:00:00.000Z"),
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
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
    const userRepository: jest.Mocked<UserRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      updateRole: jest.fn(),
      updatePlan: jest.fn(),
      completeOnboarding: jest.fn(),
      updateProfile: jest.fn(),
    };
    const usecase = new UpdateProjectRoadmapStepUsecase(
      projectRepository,
      projectRoadmapRepository,
      userRepository,
    );
    return { usecase, projectRepository, projectRoadmapRepository, userRepository };
  }

  it("updates the step's progress/dates/assignee when everything is owned by the requesting user", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, userRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(roadmap);
    projectRoadmapRepository.findStepByIdForRoadmap.mockResolvedValue(step);
    userRepository.findById.mockResolvedValue(assigneeUser);
    projectRoadmapRepository.updateStep.mockResolvedValue(updatedStep);

    const result = await usecase.execute({
      userId,
      projectId: project.id,
      stepId: step.id,
      status: "IN_PROGRESS",
      assigneeId,
    });

    expect(projectRoadmapRepository.findStepByIdForRoadmap).toHaveBeenCalledWith(
      step.id,
      roadmap.id,
    );
    expect(userRepository.findById).toHaveBeenCalledWith(assigneeId);
    expect(projectRoadmapRepository.updateStep).toHaveBeenCalledWith(step.id, {
      status: "IN_PROGRESS",
      plannedStartDate: undefined,
      plannedEndDate: undefined,
      actualStartDate: undefined,
      actualEndDate: undefined,
      assigneeId,
    });
    expect(result).toEqual(updatedStep);
  });

  it("does not look up the assignee when assigneeId is omitted", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, userRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(roadmap);
    projectRoadmapRepository.findStepByIdForRoadmap.mockResolvedValue(step);
    projectRoadmapRepository.updateStep.mockResolvedValue(updatedStep);

    await usecase.execute({ userId, projectId: project.id, stepId: step.id, status: "DONE" });

    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it("allows clearing the assignee by passing assigneeId: null", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, userRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(roadmap);
    projectRoadmapRepository.findStepByIdForRoadmap.mockResolvedValue(step);
    projectRoadmapRepository.updateStep.mockResolvedValue(updatedStep);

    await usecase.execute({ userId, projectId: project.id, stepId: step.id, assigneeId: null });

    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(projectRoadmapRepository.updateStep).toHaveBeenCalledWith(
      step.id,
      expect.objectContaining({ assigneeId: null }),
    );
  });

  it("throws BadRequestException when the assignee does not exist", async () => {
    const { usecase, projectRepository, projectRoadmapRepository, userRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(roadmap);
    projectRoadmapRepository.findStepByIdForRoadmap.mockResolvedValue(step);
    userRepository.findById.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, projectId: project.id, stepId: step.id, assigneeId }),
    ).rejects.toThrow("指定された担当者が見つかりません。");
    expect(projectRoadmapRepository.updateStep).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when the project does not belong to the requesting user", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, projectId: project.id, stepId: step.id, status: "DONE" }),
    ).rejects.toThrow("指定されたプロジェクトが見つかりません。");
    expect(projectRoadmapRepository.findDetailByProjectId).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when no roadmap has been generated yet", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, projectId: project.id, stepId: step.id, status: "DONE" }),
    ).rejects.toThrow("指定されたプロジェクトにロードマップが生成されていません。");
  });

  it("throws NotFoundException when the step does not belong to the roadmap", async () => {
    const { usecase, projectRepository, projectRoadmapRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectRoadmapRepository.findDetailByProjectId.mockResolvedValue(roadmap);
    projectRoadmapRepository.findStepByIdForRoadmap.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, projectId: project.id, stepId: step.id, status: "DONE" }),
    ).rejects.toThrow("指定された工程が見つかりません。");
  });
});
