import type { ProjectRepository } from "../domain/project.repository";

import { CreateProjectUsecase } from "./create-project.usecase";

describe("CreateProjectUsecase", () => {
  function setup() {
    const projectRepository: jest.Mocked<ProjectRepository> = {
      findManyForUser: jest.fn(),
      create: jest.fn(),
      findByIdForUser: jest.fn(),
      countForUser: jest.fn(),
    };
    const usecase = new CreateProjectUsecase(projectRepository);
    return { usecase, projectRepository };
  }

  const expected = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
    name: "新規体外診断用医薬品の510k申請",
    deviceClass: "クラスII",
    targetJurisdictions: ["US" as const],
    organizationId: null,
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
    updatedAt: new Date("2026-07-05T00:00:00.000Z"),
  };

  it("delegates to the repository with the given fields when under the plan limit", async () => {
    const { usecase, projectRepository } = setup();
    projectRepository.countForUser.mockResolvedValue(0);
    projectRepository.create.mockResolvedValue(expected);

    const result = await usecase.execute({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      plan: "FREE",
      name: "新規体外診断用医薬品の510k申請",
      deviceClass: "クラスII",
      targetJurisdictions: ["US"],
    });

    expect(projectRepository.countForUser).toHaveBeenCalledWith(
      "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
    );
    expect(projectRepository.create).toHaveBeenCalledWith({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      name: "新規体外診断用医薬品の510k申請",
      deviceClass: "クラスII",
      targetJurisdictions: ["US"],
    });
    expect(result).toEqual(expected);
  });

  it("throws 403 and does not create when the FREE plan has reached the limit (3)", async () => {
    const { usecase, projectRepository } = setup();
    projectRepository.countForUser.mockResolvedValue(3);

    await expect(
      usecase.execute({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        plan: "FREE",
        name: "4件目のプロジェクト",
        targetJurisdictions: ["US"],
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(projectRepository.create).not.toHaveBeenCalled();
  });

  it("throws 403 when the PRO plan has reached the limit (20)", async () => {
    const { usecase, projectRepository } = setup();
    projectRepository.countForUser.mockResolvedValue(20);

    await expect(
      usecase.execute({
        userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
        plan: "PRO",
        name: "21件目のプロジェクト",
        targetJurisdictions: ["US"],
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("never blocks the unlimited ENTERPRISE plan", async () => {
    const { usecase, projectRepository } = setup();
    projectRepository.countForUser.mockResolvedValue(10_000);
    projectRepository.create.mockResolvedValue(expected);

    await usecase.execute({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      plan: "ENTERPRISE",
      name: "10001件目のプロジェクト",
      targetJurisdictions: ["US"],
    });

    expect(projectRepository.create).toHaveBeenCalled();
  });
});
