import type { ProjectRepository } from "../domain/project.repository";

import { GetProjectDetailUsecase } from "./get-project-detail.usecase";

describe("GetProjectDetailUsecase", () => {
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
    };
    const usecase = new GetProjectDetailUsecase(projectRepository);
    return { usecase, projectRepository };
  }

  it("returns the project when it belongs to the requesting user", async () => {
    const { usecase, projectRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(project);

    const result = await usecase.execute({ userId, projectId: project.id });

    expect(projectRepository.findByIdForUser).toHaveBeenCalledWith(project.id, userId);
    expect(result).toEqual(project);
  });

  it("throws NotFoundException when the project does not exist or belongs to another user", async () => {
    const { usecase, projectRepository } = setup();
    projectRepository.findByIdForUser.mockResolvedValue(null);

    await expect(usecase.execute({ userId, projectId: project.id })).rejects.toThrow(
      "指定されたプロジェクトが見つかりません。",
    );
  });
});
