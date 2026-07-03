import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { PrismaModule } from "./infrastructure/database/prisma.module";
import { BullmqModule } from "./infrastructure/queue/bullmq.module";
import { RedisModule } from "./infrastructure/queue/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { UsersModule } from "./modules/users/users.module";

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
    AuthModule,
    UsersModule,
  ],
  providers: [
    // NOTE: ThrottlerModule.forRoot はデフォルト設定を宣言するのみで、
    // APP_GUARD として登録しない限り @Throttle は効かない（signupエンドポイントで初めて使用するため今回追加）。
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
