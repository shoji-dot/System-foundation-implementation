import type { ProjectTaskRepository } from "../domain/project-task.repository";
import type { ProjectRepository } from "../domain/project.repository";

import { CreateProjectTaskUsecase } from "./create-project-task.usecase";

describe("CreateProjectTaskUsecase", () => {
  const project = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    name: "新規体外診断用医薬品の510k申請",
    deviceClass: "クラスII",
    targetJurisdictions: ["US" as const],
    organizationId: null,
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
    updatedAt: new Date("2026-07-05T00:00:00.000Z"),
  };
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";

  function setup() {
    const projectRepository: jest.Mocked<ProjectRepository> = {
      findManyForUser: jest.fn(),
      create: jest.fn(),
      findByIdForUser: jest.fn(),
      countForUser: jest.fn(),
    };
    const projectTaskRepository: jest.Mocked<ProjectTaskRepository> = {
      findManyForProject: jest.fn(),
      create: jest.fn(),
      findByIdForProject: jest.fn(),
      updateStatus: jest.fn(),
    };
    const usecase = new CreateProjectTaskUsecase(projectRepository, projectTaskRepository);
    return { usecase, projectRepository, projectTaskRepository };
  }

  it("creates a task when the project belongs to the requesting user", async () => {
    const { usecase, projectRepository, projectTaskRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    const expected = {
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
      projectId: project.id,
      title: "添付文書案の作成",
      checklistItemRef: null,
      status: "TODO" as const,
      dueDate: new Date("2026-08-01T00:00:00.000Z"),
      assignee: "山田",
      createdAt: new Date("2026-07-05T00:00:00.000Z"),
      updatedAt: new Date("2026-07-05T00:00:00.000Z"),
    };
    projectTaskRepository.create.mockResolvedValue(expected);

    const result = await usecase.execute({
      userId,
      projectId: project.id,
      title: "添付文書案の作成",
      dueDate: new Date("2026-08-01T00:00:00.000Z"),
      assignee: "山田",
    });

    expect(projectRepository.findByIdForUser).toHaveBeenCalledWith(project.id, userId);
    expect(projectTaskRepository.create).toHaveBeenCalledWith({
      projectId: project.id,
      title: "添付文書案の作成",
      dueDate: new Date("2026-08-01T00:00:00.000Z"),
      assignee: "山田",
    });
    expect(result).toEqual(expected);
  });

  it("throws NotFoundException when the project does not exist or belongs to another user", async () => {
    const { usecase, projectRepository, projectTaskRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, projectId: project.id, title: "添付文書案の作成" }),
    ).rejects.toThrow("指定されたプロジェクトが見つかりません。");
    expect(projectTaskRepository.create).not.toHaveBeenCalled();
  });
});
