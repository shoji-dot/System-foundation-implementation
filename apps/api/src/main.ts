import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe";

async function bootstrap() {
  // rawBody: true — POST /billing/webhookのStripe署名検証に生ボディが必要なため
  // （req.rawBodyとして全リクエストに付与されるが、req.bodyの通常パースには影響しない）。
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const prefix = process.env.API_PREFIX ?? "api/v1";
  app.setGlobalPrefix(prefix);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000",
    credentials: true,
  });

  // 設計書⑤: 入力値検証は Zod を使用する（class-validator は導入しない）。
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ZodValidationPipe());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`[api] listening on :${port}/${prefix}`);
}

void bootstrap();
