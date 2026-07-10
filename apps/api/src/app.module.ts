import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { PrismaModule } from "./infrastructure/database/prisma.module";
import { BullmqModule } from "./infrastructure/queue/bullmq.module";
import { RedisModule } from "./infrastructure/queue/redis.module";
import { AiChatModule } from "./modules/ai/ai-chat.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { ClassificationsModule } from "./modules/classifications/classifications.module";
import { HealthModule } from "./modules/health/health.module";
import { LearningModule } from "./modules/learning/learning.module";
import { LifecycleModule } from "./modules/lifecycle/lifecycle.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { RegulationsModule } from "./modules/regulations/regulations.module";
import { SearchModule } from "./modules/search/search.module";
import { TagsModule } from "./modules/tags/tags.module";
import { UsersModule } from "./modules/users/users.module";
import { WorkflowModule } from "./modules/workflow/workflow.module";

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
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RegulationsModule,
    ClassificationsModule,
    LearningModule,
    LifecycleModule,
    SearchModule,
    WorkflowModule,
    NotificationsModule,
    ProjectsModule,
    BillingModule,
    AiChatModule,
    TagsModule,
  ],
  providers: [
    // NOTE: ThrottlerModule.forRoot はデフォルト設定を宣言するのみで、
    // APP_GUARD として登録しない限り @Throttle は効かない（signupエンドポイントで初めて使用するため今回追加）。
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
