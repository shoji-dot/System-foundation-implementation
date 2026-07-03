import { Module } from "@nestjs/common";

import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { RedisModule } from "../../infrastructure/queue/redis.module";

import { HealthController } from "./health.controller";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}
