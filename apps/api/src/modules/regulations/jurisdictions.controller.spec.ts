import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListJurisdictionsUsecase } from "../../core/usecases/list-jurisdictions.usecase";

import { JurisdictionsController } from "./jurisdictions.controller";

describe("JurisdictionsController", () => {
  let controller: JurisdictionsController;
  const execute = jest.fn();

  beforeEach(async () => {
    execute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JurisdictionsController],
      providers: [{ provide: ListJurisdictionsUsecase, useValue: { execute } }],
    })
      // JwtAuthGuardはTOKEN_SERVICEに依存するため、コントローラ単体テストではガード自体の
      // 振る舞い(jwt-auth.guard.spec.tsで別途検証済み)を検証せず、常に通過させる。
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(JurisdictionsController);
  });

  it("returns all jurisdictions as response DTOs", async () => {
    execute.mockResolvedValue([
      {
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
        code: "JP",
        name: "日本",
        authority: "PMDA",
        createdAt: new Date("2026-07-04T00:00:00.000Z"),
        updatedAt: new Date("2026-07-04T00:00:00.000Z"),
      },
    ]);

    const result = await controller.list();

    expect(execute).toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
        code: "JP",
        name: "日本",
        authority: "PMDA",
      },
    ]);
  });
});
