import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { EMBEDDING_PROVIDER } from "../../core/domain/embedding-provider";
import { REGULATION_SECTION_EMBEDDING_REPOSITORY } from "../../core/domain/regulation-section-embedding.repository";
import { BackfillRegulationSectionEmbeddingsUsecase } from "../../core/usecases/backfill-regulation-section-embeddings.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaRegulationSectionEmbeddingRepository } from "../../infrastructure/database/repositories/prisma-regulation-section-embedding.repository";
import { OpenAiEmbeddingProvider } from "../../infrastructure/external/llm/openai-embedding.provider";

import { EMBEDDING_BACKFILL_QUEUE_NAME } from "./ai.constants";
import { EmbeddingBackfillProcessor } from "./embedding-backfill.processor";
import { EmbeddingBackfillScheduler } from "./embedding-backfill.scheduler";

/**
 * AIモジュール（設計書③ modules/ai「AIチャット・RAG」）。
 * Worker プロセス（apps/api/src/worker/main.ts）にのみ組み込む（IngestionModuleと同方針）。
 * 本コミットでは埋め込みバックフィル（regulation_sections.embeddingの非同期生成）のみを配線する。
 * chat/classify APIコントローラ（HTTP側、apps/api本体プロセス）は次コミットで追加する。
 */
@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: EMBEDDING_BACKFILL_QUEUE_NAME })],
  providers: [
    BackfillRegulationSectionEmbeddingsUsecase,
    EmbeddingBackfillProcessor,
    EmbeddingBackfillScheduler,
    { provide: EMBEDDING_PROVIDER, useClass: OpenAiEmbeddingProvider },
    {
      provide: REGULATION_SECTION_EMBEDDING_REPOSITORY,
      useClass: PrismaRegulationSectionEmbeddingRepository,
    },
  ],
})
export class AiModule {}
