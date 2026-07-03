import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.API_PREFIX ?? "api/v1";
  app.setGlobalPrefix(prefix);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000",
    credentials: true,
  });

  // NOTE: 設計書⑤に基づき入力値検証は Zod を使用する（class-validator は導入しない）。
  // Zodベースのグローバルバリデーションパイプは、最初にDTOを持つエンドポイントを
  // 実装するタイミング（Phase 1）で追加する。
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`[api] listening on :${port}/${prefix}`);
}

void bootstrap();
