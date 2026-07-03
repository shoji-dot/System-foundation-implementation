import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

import { PrismaModule } from "./infrastructure/database/prisma.module";
import { BullmqModule } from "./infrastructure/queue/bullmq.module";
import { RedisModule } from "./infrastructure/queue/redis.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    BullmqModule,
    HealthModule,
  ],
})
export class AppModule {}
