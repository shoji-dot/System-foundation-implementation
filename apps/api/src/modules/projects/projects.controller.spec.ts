import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateProjectTaskUsecase } from "../../core/usecases/create-project-task.usecase";
import { CreateProjectUsecase } from "../../core/usecases/create-project.usecase";
import { GetProjectDetailUsecase } from "../../core/usecases/get-project-detail.usecase";
import { ListProjectTasksUsecase } from "../../core/usecases/list-project-tasks.usecase";
import { ListProjectsUsecase } from "../../core/usecases/list-projects.usecase";
import { UpdateProjectTaskStatusUsecase } from "../../core/usecases/update-project-task-status.usecase";

import { ProjectsController } from "./projects.controller";

describe("ProjectsController", () => {
  let controller: ProjectsController;
  const listExecute = jest.fn();
  const createExecute = jest.fn();
  const detailExecute = jest.fn();
  const listTasksExecute = jest.fn();
  const createTaskExecute = jest.fn();
  const updateTaskStatusExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    createExecute.mockReset();
    detailExecute.mockReset();
    listTasksExecute.mockReset();
    createTaskExecute.mockReset();
    updateTaskStatusExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ListProjectsUsecase, useValue: { execute: listExecute } },
        { provide: CreateProjectUsecase, useValue: { execute: createExecute } },
        { provide: GetProjectDetailUsecase, useValue: { execute: detailExecute } },
        { provide: ListProjectTasksUsecase, useValue: { execute: listTasksExecute } },
        { provide: CreateProjectTaskUsecase, useValue: { execute: createTaskExecute } },
        {
          provide: UpdateProjectTaskStatusUsecase,
          useValue: { execute: updateTaskStatusExecute },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ProjectsController);
  });

  const request = {
    user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b", plan: "FREE" },
  } as AuthenticatedRequest;

  const project = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    name: "新規体外診断用医薬品の510k申請",
    deviceClass: "クラスII",
    targetJurisdictions: ["US"],
    organizationId: null,
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
    updatedAt: new Date("2026-07-05T00:00:00.000Z"),
  };

  describe("list", () => {
    it("uses the authenticated user's id and maps the response, formatting dates as strings", async () => {
      listExecute.mockResolvedValue({ items: [project], nextCursor: null });

      const result = await controller.list(request, { cursor: undefined, limit: 20 });

      expect(listExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: project.id,
            name: project.name,
            deviceClass: project.deviceClass,
            targetJurisdictions: project.targetJurisdictions,
            organizationId: null,
            createdAt: "2026-07-05T00:00:00.000Z",
          },
        ],
        nextCursor: null,
      });
    });
  });

  describe("create", () => {
    it("uses the authenticated user's id and maps the response", async () => {
      createExecute.mockResolvedValue(project);

      const result = await controller.create(request, {
        name: project.name,
        deviceClass: project.deviceClass,
        targetJurisdictions: project.targetJurisdictions as ["US"],
      });

      expect(createExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        plan: "FREE",
        name: project.name,
        deviceClass: project.deviceClass,
        targetJurisdictions: project.targetJurisdictions,
      });
      expect(result).toEqual({
        id: project.id,
        name: project.name,
        deviceClass: project.deviceClass,
        targetJurisdictions: project.targetJurisdictions,
        organizationId: null,
        createdAt: "2026-07-05T00:00:00.000Z",
      });
    });
  });

  describe("detail", () => {
    it("uses the authenticated user's id and project id, and maps the response", async () => {
      detailExecute.mockResolvedValue(project);

      const result = await controller.detail(request, { id: project.id });

      expect(detailExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        projectId: project.id,
      });
      expect(result).toEqual({
        id: project.id,
        name: project.name,
        deviceClass: project.deviceClass,
        targetJurisdictions: project.targetJurisdictions,
        organizationId: null,
        createdAt: "2026-07-05T00:00:00.000Z",
      });
    });
  });

  describe("listTasks", () => {
    it("uses the authenticated user's id and project id, and maps the response", async () => {
      listTasksExecute.mockResolvedValue([
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
          projectId: project.id,
          title: "添付文書案の作成",
          checklistItemRef: null,
          status: "TODO",
          dueDate: new Date("2026-08-01T00:00:00.000Z"),
          assignee: "山田",
          createdAt: new Date("2026-07-05T00:00:00.000Z"),
          updatedAt: new Date("2026-07-05T00:00:00.000Z"),
        },
      ]);

      const result = await controller.listTasks(request, { id: project.id });

      expect(listTasksExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        projectId: project.id,
      });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
            title: "添付文書案の作成",
            status: "TODO",
            dueDate: "2026-08-01",
            assignee: "山田",
            createdAt: "2026-07-05T00:00:00.000Z",
          },
        ],
      });
    });
  });

  describe("createTask", () => {
    it("uses the authenticated user's id and project id, parses dueDate, and maps the response", async () => {
      createTaskExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
        projectId: project.id,
        title: "添付文書案の作成",
        checklistItemRef: null,
        status: "TODO",
        dueDate: new Date("2026-08-01T00:00:00.000Z"),
        assignee: "山田",
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
        updatedAt: new Date("2026-07-05T00:00:00.000Z"),
      });

      const result = await controller.createTask(
        request,
        { id: project.id },
        {
          title: "添付文書案の作成",
          dueDate: "2026-08-01",
          assignee: "山田",
        },
      );

      expect(createTaskExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        projectId: project.id,
        title: "添付文書案の作成",
        dueDate: new Date("2026-08-01"),
        assignee: "山田",
      });
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
        title: "添付文書案の作成",
        status: "TODO",
        dueDate: "2026-08-01",
        assignee: "山田",
        createdAt: "2026-07-05T00:00:00.000Z",
      });
    });

    it("omits dueDate/assignee when not provided", async () => {
      createTaskExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
        projectId: project.id,
        title: "添付文書案の作成",
        checklistItemRef: null,
        status: "TODO",
        dueDate: null,
        assignee: null,
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
        updatedAt: new Date("2026-07-05T00:00:00.000Z"),
      });

      await controller.createTask(request, { id: project.id }, { title: "添付文書案の作成" });

      expect(createTaskExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        projectId: project.id,
        title: "添付文書案の作成",
        dueDate: undefined,
        assignee: undefined,
      });
    });
  });

  describe("updateTaskStatus", () => {
    it("uses the authenticated user's id/project id/task id, and maps the response", async () => {
      updateTaskStatusExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
        projectId: project.id,
        title: "添付文書案の作成",
        checklistItemRef: null,
        status: "DONE",
        dueDate: null,
        assignee: null,
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
        updatedAt: new Date("2026-07-05T00:00:00.000Z"),
      });

      const result = await controller.updateTaskStatus(
        request,
        { id: project.id, taskId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d" },
        { status: "DONE" },
      );

      expect(updateTaskStatusExecute).toHaveBeenCalledWith({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        projectId: project.id,
        taskId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
        status: "DONE",
      });
      expect(result).toEqual({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
        title: "添付文書案の作成",
        status: "DONE",
        dueDate: null,
        assignee: null,
        createdAt: "2026-07-05T00:00:00.000Z",
      });
    });
  });
});
