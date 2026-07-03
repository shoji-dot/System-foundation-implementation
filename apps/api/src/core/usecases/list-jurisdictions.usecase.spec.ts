import type { Jurisdiction } from "../domain/jurisdiction.entity";
import type { JurisdictionRepository } from "../domain/jurisdiction.repository";

import { ListJurisdictionsUsecase } from "./list-jurisdictions.usecase";

describe("ListJurisdictionsUsecase", () => {
  const jpJurisdiction: Jurisdiction = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    code: "JP",
    name: "日本",
    authority: "PMDA",
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    updatedAt: new Date("2026-07-04T00:00:00.000Z"),
  };

  function setup() {
    const jurisdictionRepository: jest.Mocked<JurisdictionRepository> = {
      findAll: jest.fn(),
    };
    const usecase = new ListJurisdictionsUsecase(jurisdictionRepository);
    return { usecase, jurisdictionRepository };
  }

  it("returns all jurisdictions from the repository", async () => {
    const { usecase, jurisdictionRepository } = setup();
    jurisdictionRepository.findAll.mockResolvedValue([jpJurisdiction]);

    const result = await usecase.execute();

    expect(jurisdictionRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual([jpJurisdiction]);
  });
});
