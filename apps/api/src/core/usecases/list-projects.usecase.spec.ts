import type { ProjectRepository } from "../domain/project.repository";

import { ListProjectsUsecase } from "./list-projects.usecase";

describe("ListProjectsUsecase", () => {
  function setup() {
    const projectRepository: jest.Mocked<ProjectRepository> = {
      findManyForUser: jest.fn(),
      create: jest.fn(),
      findByIdForUser: jest.fn(),
    };
    const usecase = new ListProjectsUsecase(projectRepository);
    return { usecase, projectRepository };
  }

  it("delegates to the repository with the given userId/cursor/limit", async () => {
    const { usecase, projectRepository } = setup();
    const expected = {
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          name: "新規体外診断用医薬品の510k申請",
          deviceClass: "クラスII",
          targetJurisdictions: ["US" as const],
          organizationId: null,
          createdAt: new Date("2026-07-05T00:00:00.000Z"),
          updatedAt: new Date("2026-07-05T00:00:00.000Z"),
        },
      ],
      nextCursor: null,
    };
    projectRepository.findManyForUser.mockResolvedValue(expected);

    const result = await usecase.execute({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      cursor: undefined,
      limit: 20,
    });

    expect(projectRepository.findManyForUser).toHaveBeenCalledWith({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      cursor: undefined,
      limit: 20,
    });
    expect(result).toEqual(expected);
  });
});
