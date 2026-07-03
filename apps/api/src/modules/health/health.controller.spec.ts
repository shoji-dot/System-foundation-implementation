import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { PrismaService } from "../../infrastructure/database/prisma.service";
import { REDIS_CLIENT } from "../../infrastructure/queue/redis.module";

import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: jest.fn() } },
        { provide: REDIS_CLIENT, useValue: { ping: jest.fn() } },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it("returns ok status", () => {
    const result = controller.check();
    expect(result.status).toBe("ok");
    expect(result.service).toBe("api");
  });
});
