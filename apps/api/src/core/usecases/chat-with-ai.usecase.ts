import { createHash } from "node:crypto";

import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AI_CHAT_ANSWER_CACHE } from "../domain/ai-chat-answer-cache";
import type { AiChatAnswerCache } from "../domain/ai-chat-answer-cache";
import { AI_CHAT_QUOTA_LIMITER } from "../domain/ai-chat-quota-limiter";
import type { AiChatQuotaLimiter } from "../domain/ai-chat-quota-limiter";
import { AI_CHAT_SESSION_REPOSITORY } from "../domain/ai-chat-session.repository";
import type {
  AiChatHistoryMessage,
  AiChatSessionRepository,
} from "../domain/ai-chat-session.repository";
import type { AiChatCitation } from "../domain/ai-chat.entity";
import { CHAT_COMPLETION_PROVIDER } from "../domain/chat-completion-provider";
import type {
  ChatCompletionMessage,
  ChatCompletionProvider,
} from "../domain/chat-completion-provider";
import { EMBEDDING_PROVIDER } from "../domain/embedding-provider";
import type { EmbeddingProvider } from "../domain/embedding-provider";
import { RAG_SEARCH_REPOSITORY } from "../domain/rag-search.repository";
import type { RagSearchHit, RagSearchRepository } from "../domain/rag-search.repository";
import type { Plan } from "../domain/user.entity";

import {
  DISCLAIMER_TEXT,
  NO_HIT_REFUSAL_TEXT,
  RAG_TOP_K,
  RECENT_MESSAGES_CONTEXT_LIMIT,
} from "./chat-with-ai.constants";

export interface ChatWithAiInput {
  userId: string;
  plan: Plan;
  sessionId?: string;
  message: string;
}

export type ChatWithAiEvent =
  | { type: "citations"; citations: AiChatCitation[] }
  | { type: "token"; token: string }
  | { type: "done"; sessionId: string; messageId: string };

const SESSION_TITLE_MAX_LENGTH = 50;

/**
 * 設計書⑤ POST /api/v1/ai/chat、設計書⑥ RAGパイプライン本体。
 * ハイブリッド検索（pgvector cos類似 + pg_trgmあいまい検索、RRF融合）→上位k=8セクション→
 * LLMコンテキスト注入→SSEストリーミング（呼び出し側でonEventをSSEイベントへ中継）。
 * コスト制御（回答キャッシュ・日次回数制限）はユーザー承認済み方針:
 * - 日次回数制限はキャッシュ有無に関わらず常に消費する（「AI回数」自体を制限する設計書⑥の趣旨に合わせる）。
 * - キャッシュヒット時はLLM呼び出し・埋め込み生成をスキップする。
 */
@Injectable()
export class ChatWithAiUsecase {
  constructor(
    @Inject(AI_CHAT_QUOTA_LIMITER) private readonly quotaLimiter: AiChatQuotaLimiter,
    @Inject(AI_CHAT_ANSWER_CACHE) private readonly answerCache: AiChatAnswerCache,
    @Inject(AI_CHAT_SESSION_REPOSITORY)
    private readonly sessionRepository: AiChatSessionRepository,
    @Inject(RAG_SEARCH_REPOSITORY) private readonly ragSearchRepository: RagSearchRepository,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddingProvider: EmbeddingProvider,
    @Inject(CHAT_COMPLETION_PROVIDER)
    private readonly chatCompletionProvider: ChatCompletionProvider,
  ) {}

  async execute(input: ChatWithAiInput, onEvent: (event: ChatWithAiEvent) => void): Promise<void> {
    const quota = await this.quotaLimiter.consume(input.userId, input.plan);
    if (!quota.allowed) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Too Many Requests",
          status: HttpStatus.TOO_MANY_REQUESTS,
          detail: `無料プランのAIチャット利用回数の上限（${quota.limit}回/日）に達しました。日付が変わるまでお待ちいただくか、プランのアップグレードをご検討ください。`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const sessionId = await this.resolveSessionId(input.userId, input.sessionId, input.message);

    await this.sessionRepository.appendMessage(sessionId, {
      role: "USER",
      content: input.message,
      citations: null,
    });

    const cacheKey = this.computeCacheKey(input.message);
    const cached = await this.answerCache.get(cacheKey);
    if (cached) {
      await this.emitAnswer(sessionId, cached.answer, cached.citations, onEvent);
      return;
    }

    const queryEmbedding = await this.embeddingProvider.embed(input.message);
    const hits = await this.ragSearchRepository.hybridSearch(
      input.message,
      queryEmbedding,
      RAG_TOP_K,
    );

    if (hits.length === 0) {
      // 設計書⑥「根拠なし回答の禁止、検索ヒット0件時は回答拒否テンプレート」。LLMは呼び出さない。
      await this.emitAnswer(sessionId, NO_HIT_REFUSAL_TEXT, [], onEvent);
      return;
    }

    const citations = hits.map((hit) => hit.citation);
    onEvent({ type: "citations", citations });

    const history = await this.sessionRepository.findRecentMessages(
      sessionId,
      RECENT_MESSAGES_CONTEXT_LIMIT,
    );
    const messages = this.buildPromptMessages(history, hits);

    let generatedAnswer = "";
    await this.chatCompletionProvider.streamComplete(messages, (token) => {
      generatedAnswer += token;
      onEvent({ type: "token", token });
    });

    const disclaimerChunk = `\n\n${DISCLAIMER_TEXT}`;
    onEvent({ type: "token", token: disclaimerChunk });
    const fullAnswer = generatedAnswer + disclaimerChunk;

    await this.answerCache.set(cacheKey, { answer: fullAnswer, citations });

    const saved = await this.sessionRepository.appendMessage(sessionId, {
      role: "ASSISTANT",
      content: fullAnswer,
      citations,
    });
    onEvent({ type: "done", sessionId, messageId: saved.id });
  }

  /** キャッシュヒット・検索ヒット0件のいずれも「回答を1つのtokenイベントで送る→永続化→done」という同じ形になるため共通化する。 */
  private async emitAnswer(
    sessionId: string,
    answer: string,
    citations: AiChatCitation[],
    onEvent: (event: ChatWithAiEvent) => void,
  ): Promise<void> {
    onEvent({ type: "citations", citations });
    onEvent({ type: "token", token: answer });

    const saved = await this.sessionRepository.appendMessage(sessionId, {
      role: "ASSISTANT",
      content: answer,
      citations: citations.length > 0 ? citations : null,
    });
    onEvent({ type: "done", sessionId, messageId: saved.id });
  }

  private async resolveSessionId(
    userId: string,
    sessionId: string | undefined,
    firstMessage: string,
  ): Promise<string> {
    if (sessionId) {
      const session = await this.sessionRepository.findSessionOwnedByUser(sessionId, userId);
      if (!session) {
        throw new NotFoundException("指定されたチャットセッションが見つかりません。");
      }
      return session.id;
    }

    const title = firstMessage.slice(0, SESSION_TITLE_MAX_LENGTH);
    const created = await this.sessionRepository.createSession(userId, title);
    return created.id;
  }

  /** 質問正規化ハッシュ（設計書⑥「回答キャッシュ（質問正規化ハッシュ）」）。 */
  private computeCacheKey(message: string): string {
    const normalized = message.trim().replace(/\s+/g, " ").toLowerCase();
    return createHash("sha256").update(normalized).digest("hex");
  }

  private buildPromptMessages(
    history: AiChatHistoryMessage[],
    hits: RagSearchHit[],
  ): ChatCompletionMessage[] {
    const context = hits
      .map(
        (hit, index) =>
          `[${index + 1}] ${hit.citation.regulationTitle}（${hit.citation.jurisdiction.name}, 第${hit.citation.versionNo}版, ${hit.citation.path}）\n${hit.body}`,
      )
      .join("\n\n");

    const systemPrompt = [
      "あなたは医療機器の薬事承認に関する質問に答える専門アシスタントです。",
      "以下の「参考条文」の内容のみに基づいて回答してください。参考条文に記載が無い内容は推測せず、",
      "「参考条文からは判断できません」と述べてください。",
      "回答内では根拠とした参考条文の番号（例: [1]）を明示してください。",
      "",
      "# 参考条文",
      context,
    ].join("\n");

    return [
      { role: "system", content: systemPrompt },
      ...history.map((message): ChatCompletionMessage => ({
        role: message.role === "USER" ? "user" : "assistant",
        content: message.content,
      })),
    ];
  }
}
