import type { ProjectTaskRepository } from "../domain/project-task.repository";
import type { ProjectRepository } from "../domain/project.repository";

import { UpdateProjectTaskStatusUsecase } from "./update-project-task-status.usecase";

describe("UpdateProjectTaskStatusUsecase", () => {
  const project = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    name: "新規体外診断用医薬品の510k申請",
    deviceClass: "クラスII",
    targetJurisdictions: ["US" as const],
    organizationId: null,
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
    updatedAt: new Date("2026-07-05T00:00:00.000Z"),
  };
  const task = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
    projectId: project.id,
    title: "添付文書案の作成",
    checklistItemRef: null,
    status: "TODO" as const,
    dueDate: null,
    assignee: null,
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
    const usecase = new UpdateProjectTaskStatusUsecase(projectRepository, projectTaskRepository);
    return { usecase, projectRepository, projectTaskRepository };
  }

  it("updates the status when the project and task belong to the requesting user", async () => {
    const { usecase, projectRepository, projectTaskRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectTaskRepository.findByIdForProject.mockResolvedValue(task);
    const updated = { ...task, status: "DONE" as const };
    projectTaskRepository.updateStatus.mockResolvedValue(updated);

    const result = await usecase.execute({
      userId,
      projectId: project.id,
      taskId: task.id,
      status: "DONE",
    });

    expect(projectRepository.findByIdForUser).toHaveBeenCalledWith(project.id, userId);
    expect(projectTaskRepository.findByIdForProject).toHaveBeenCalledWith(task.id, project.id);
    expect(projectTaskRepository.updateStatus).toHaveBeenCalledWith(task.id, "DONE");
    expect(result).toEqual(updated);
  });

  it("throws NotFoundException when the project does not exist or belongs to another user", async () => {
    const { usecase, projectRepository, projectTaskRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, projectId: project.id, taskId: task.id, status: "DONE" }),
    ).rejects.toThrow("指定されたプロジェクトが見つかりません。");
    expect(projectTaskRepository.findByIdForProject).not.toHaveBeenCalled();
    expect(projectTaskRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when the task does not exist or belongs to another project", async () => {
    const { usecase, projectRepository, projectTaskRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);
    projectTaskRepository.findByIdForProject.mockResolvedValue(null);

    await expect(
      usecase.execute({ userId, projectId: project.id, taskId: task.id, status: "DONE" }),
    ).rejects.toThrow("指定されたタスクが見つかりません。");
    expect(projectTaskRepository.updateStatus).not.toHaveBeenCalled();
  });
});
