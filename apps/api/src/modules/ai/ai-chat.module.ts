import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AI_CHAT_ANSWER_CACHE } from "../../core/domain/ai-chat-answer-cache";
// NOTE: AI_CHAT_QUOTA_LIMITER は名称はchat由来だが、ユーザー承認済み方針によりclassifyとも共有する
// 「AI機能全体の日次利用回数」カウンターとして使う（設計書⑥のエンタイトルメント「AI回数」が
// 機能横断の単一フラグのため）。
import { AI_CHAT_QUOTA_LIMITER } from "../../core/domain/ai-chat-quota-limiter";
import { AI_CHAT_SESSION_REPOSITORY } from "../../core/domain/ai-chat-session.repository";
import { CHAT_COMPLETION_PROVIDER } from "../../core/domain/chat-completion-provider";
import { CLASSIFICATION_SEARCH_REPOSITORY } from "../../core/domain/classification-search.repository";
import { EMBEDDING_PROVIDER } from "../../core/domain/embedding-provider";
import { RAG_SEARCH_REPOSITORY } from "../../core/domain/rag-search.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { ChatWithAiUsecase } from "../../core/usecases/chat-with-ai.usecase";
import { ClassifyDeviceUsecase } from "../../core/usecases/classify-device.usecase";
import { ListAiChatMessagesUsecase } from "../../core/usecases/list-ai-chat-messages.usecase";
import { ListAiChatSessionsUsecase } from "../../core/usecases/list-ai-chat-sessions.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaAiChatSessionRepository } from "../../infrastructure/database/repositories/prisma-ai-chat-session.repository";
import { PrismaClassificationSearchRepository } from "../../infrastructure/database/repositories/prisma-classification-search.repository";
import { PrismaRagSearchRepository } from "../../infrastructure/database/repositories/prisma-rag-search.repository";
import { RedisAiChatAnswerCache } from "../../infrastructure/external/cache/redis-ai-chat-answer-cache";
import { RedisAiChatQuotaLimiter } from "../../infrastructure/external/cache/redis-ai-chat-quota-limiter";
import { OpenAiChatCompletionProvider } from "../../infrastructure/external/llm/openai-chat-completion.provider";
import { OpenAiEmbeddingProvider } from "../../infrastructure/external/llm/openai-embedding.provider";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { AiChatController } from "./ai-chat.controller";

/**
 * AI機能HTTP APIモジュール（設計書③ modules/ai「AIチャット・RAG」、設計書⑤ POST /api/v1/ai/{chat|classify}）。
 * apps/api 本体プロセス（AppModule）に組み込む。埋め込みバックフィル（AiModule、Worker専用）とは別モジュールに分離し、
 * IngestionModule/RunIngestionJobUsecase等と同様にプロセス単位で責務を分ける（設計書①③準拠）。
 * REDIS_CLIENT は RedisModule が @Global() のため明示importは不要（AppModuleで登録済み、AuthModuleと同方針）。
 */
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AiChatController],
  providers: [
    ChatWithAiUsecase,
    ClassifyDeviceUsecase,
    ListAiChatSessionsUsecase,
    ListAiChatMessagesUsecase,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: AI_CHAT_QUOTA_LIMITER, useClass: RedisAiChatQuotaLimiter },
    { provide: AI_CHAT_ANSWER_CACHE, useClass: RedisAiChatAnswerCache },
    { provide: AI_CHAT_SESSION_REPOSITORY, useClass: PrismaAiChatSessionRepository },
    { provide: RAG_SEARCH_REPOSITORY, useClass: PrismaRagSearchRepository },
    { provide: CLASSIFICATION_SEARCH_REPOSITORY, useClass: PrismaClassificationSearchRepository },
    { provide: EMBEDDING_PROVIDER, useClass: OpenAiEmbeddingProvider },
    { provide: CHAT_COMPLETION_PROVIDER, useClass: OpenAiChatCompletionProvider },
  ],
})
export class AiChatModule {}
