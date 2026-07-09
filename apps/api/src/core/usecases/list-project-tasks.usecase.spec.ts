import type { ProjectTaskRepository } from "../domain/project-task.repository";
import type { ProjectRepository } from "../domain/project.repository";

import { ListProjectTasksUsecase } from "./list-project-tasks.usecase";

describe("ListProjectTasksUsecase", () => {
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
    const usecase = new ListProjectTasksUsecase(projectRepository, projectTaskRepository);
    return { usecase, projectRepository, projectTaskRepository };
  }

  it("returns the project's tasks when the project belongs to the requesting user", async () => {
    const { usecase, projectRepository, projectTaskRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    const tasks = [
      {
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
        projectId: project.id,
        title: "添付文書案の作成",
        checklistItemRef: null,
        status: "TODO" as const,
        dueDate: null,
        assignee: null,
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
        updatedAt: new Date("2026-07-05T00:00:00.000Z"),
      },
    ];
    projectTaskRepository.findManyForProject.mockResolvedValue(tasks);

    const result = await usecase.execute({ userId, projectId: project.id });

    expect(projectRepository.findByIdForUser).toHaveBeenCalledWith(project.id, userId);
    expect(projectTaskRepository.findManyForProject).toHaveBeenCalledWith(project.id);
    expect(result).toEqual(tasks);
  });

  it("throws NotFoundException when the project does not exist or belongs to another user", async () => {
    const { usecase, projectRepository, projectTaskRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(null);

    await expect(usecase.execute({ userId, projectId: project.id })).rejects.toThrow(
      "指定されたプロジェクトが見つかりません。",
    );
    expect(projectTaskRepository.findManyForProject).not.toHaveBeenCalled();
  });
});
