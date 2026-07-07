import type { AiChatAnswerCache } from "../domain/ai-chat-answer-cache";
import type { AiChatQuotaLimiter } from "../domain/ai-chat-quota-limiter";
import type { AiChatSessionRepository } from "../domain/ai-chat-session.repository";
import type { ChatCompletionProvider } from "../domain/chat-completion-provider";
import type { EmbeddingProvider } from "../domain/embedding-provider";
import type { RagSearchHit, RagSearchRepository } from "../domain/rag-search.repository";

import type { ChatWithAiEvent } from "./chat-with-ai.usecase";
import { ChatWithAiUsecase } from "./chat-with-ai.usecase";

describe("ChatWithAiUsecase", () => {
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";
  const sessionId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c";

  const hit: RagSearchHit = {
    sectionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
    body: "医療機器の製造販売業者は、厚生労働大臣の許可を受けなければならない。",
    citation: {
      sectionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
      regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5e",
      regulationTitle: "医薬品医療機器等法",
      jurisdiction: { code: "JP", name: "日本" },
      versionNo: 1,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
      path: "第23条の2",
      heading: "製造販売業の許可",
    },
  };

  function setup() {
    const quotaLimiter: jest.Mocked<AiChatQuotaLimiter> = { consume: jest.fn() };
    const answerCache: jest.Mocked<AiChatAnswerCache> = { get: jest.fn(), set: jest.fn() };
    const sessionRepository: jest.Mocked<AiChatSessionRepository> = {
      findSessionOwnedByUser: jest.fn(),
      createSession: jest.fn(),
      findRecentMessages: jest.fn(),
      appendMessage: jest.fn(),
      findManyForUser: jest.fn(),
      findMessages: jest.fn(),
    };
    const ragSearchRepository: jest.Mocked<RagSearchRepository> = { hybridSearch: jest.fn() };
    const embeddingProvider: jest.Mocked<EmbeddingProvider> = {
      dimensions: 1536,
      embed: jest.fn(),
    };
    const chatCompletionProvider: jest.Mocked<ChatCompletionProvider> = {
      streamComplete: jest.fn(),
    };

    quotaLimiter.consume.mockResolvedValue({ allowed: true, limit: 10, remaining: 9 });
    sessionRepository.createSession.mockResolvedValue({ id: sessionId });
    sessionRepository.findSessionOwnedByUser.mockResolvedValue({ id: sessionId });
    sessionRepository.appendMessage.mockResolvedValue({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f",
      createdAt: new Date("2026-07-07T00:00:00.000Z"),
    });
    sessionRepository.findRecentMessages.mockResolvedValue([{ role: "USER", content: "質問" }]);
    answerCache.get.mockResolvedValue(null);

    const usecase = new ChatWithAiUsecase(
      quotaLimiter,
      answerCache,
      sessionRepository,
      ragSearchRepository,
      embeddingProvider,
      chatCompletionProvider,
    );

    return {
      usecase,
      quotaLimiter,
      answerCache,
      sessionRepository,
      ragSearchRepository,
      embeddingProvider,
      chatCompletionProvider,
    };
  }

  it("throws 429 (RFC 9457) before touching the session/search/LLM when the daily quota is exceeded", async () => {
    const { usecase, quotaLimiter, sessionRepository, ragSearchRepository, embeddingProvider } =
      setup();
    quotaLimiter.consume.mockResolvedValue({ allowed: false, limit: 10, remaining: 0 });

    await expect(
      usecase.execute({ userId, plan: "FREE", message: "質問" }, jest.fn()),
    ).rejects.toMatchObject({ status: 429 });

    expect(sessionRepository.createSession).not.toHaveBeenCalled();
    expect(ragSearchRepository.hybridSearch).not.toHaveBeenCalled();
    expect(embeddingProvider.embed).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when sessionId does not belong to the requesting user", async () => {
    const { usecase, sessionRepository } = setup();
    sessionRepository.findSessionOwnedByUser.mockResolvedValue(null);

    await expect(
      usecase.execute(
        { userId, plan: "FREE", sessionId: "other-session", message: "質問" },
        jest.fn(),
      ),
    ).rejects.toThrow("指定されたチャットセッションが見つかりません。");
  });

  it("creates a new session (title truncated from the message) when sessionId is omitted", async () => {
    const {
      usecase,
      sessionRepository,
      ragSearchRepository,
      embeddingProvider,
      chatCompletionProvider,
    } = setup();
    embeddingProvider.embed.mockResolvedValue([0.1]);
    ragSearchRepository.hybridSearch.mockResolvedValue([hit]);
    chatCompletionProvider.streamComplete.mockImplementation(async (_messages, onToken) => {
      onToken("回答本文");
      return "回答本文";
    });

    await usecase.execute(
      { userId, plan: "PRO", message: "承認申請の流れを教えてください" },
      jest.fn(),
    );

    expect(sessionRepository.createSession).toHaveBeenCalledWith(
      userId,
      "承認申請の流れを教えてください",
    );
  });

  it("serves a cached answer without calling the embedding/search/LLM providers", async () => {
    const { usecase, answerCache, embeddingProvider, ragSearchRepository, chatCompletionProvider } =
      setup();
    answerCache.get.mockResolvedValue({ answer: "キャッシュ済み回答", citations: [hit.citation] });

    const events: ChatWithAiEvent[] = [];
    await usecase.execute({ userId, plan: "FREE", message: "質問" }, (event) => events.push(event));

    expect(embeddingProvider.embed).not.toHaveBeenCalled();
    expect(ragSearchRepository.hybridSearch).not.toHaveBeenCalled();
    expect(chatCompletionProvider.streamComplete).not.toHaveBeenCalled();
    expect(events).toEqual([
      { type: "citations", citations: [hit.citation] },
      { type: "token", token: "キャッシュ済み回答" },
      {
        type: "done",
        sessionId,
        messageId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f",
      },
    ]);
  });

  it("returns the fixed refusal template without calling the LLM when hybrid search finds zero hits", async () => {
    const { usecase, ragSearchRepository, chatCompletionProvider, answerCache } = setup();
    ragSearchRepository.hybridSearch.mockResolvedValue([]);

    const events: ChatWithAiEvent[] = [];
    await usecase.execute({ userId, plan: "FREE", message: "無関係な質問" }, (event) =>
      events.push(event),
    );

    expect(chatCompletionProvider.streamComplete).not.toHaveBeenCalled();
    expect(answerCache.set).not.toHaveBeenCalled();
    expect(events[0]).toEqual({ type: "citations", citations: [] });
    expect(events[1]).toMatchObject({ type: "token" });
    expect((events[1] as { token: string }).token).toContain("回答を控えます");
  });

  it("streams tokens, appends the disclaimer, persists the assistant message, and caches the answer", async () => {
    const {
      usecase,
      ragSearchRepository,
      embeddingProvider,
      chatCompletionProvider,
      answerCache,
      sessionRepository,
    } = setup();
    embeddingProvider.embed.mockResolvedValue([0.1, 0.2]);
    ragSearchRepository.hybridSearch.mockResolvedValue([hit]);
    chatCompletionProvider.streamComplete.mockImplementation(async (_messages, onToken) => {
      onToken("製造販売業には許可が必要です[1]。");
      return "製造販売業には許可が必要です[1]。";
    });

    const events: ChatWithAiEvent[] = [];
    await usecase.execute(
      { userId, plan: "FREE", sessionId, message: "製造販売業には何が必要ですか" },
      (event) => events.push(event),
    );

    expect(embeddingProvider.embed).toHaveBeenCalledWith("製造販売業には何が必要ですか");
    expect(ragSearchRepository.hybridSearch).toHaveBeenCalledWith(
      "製造販売業には何が必要ですか",
      [0.1, 0.2],
      8,
    );

    const tokenEvents = events.filter((event) => event.type === "token") as {
      type: "token";
      token: string;
    }[];
    const fullAnswer = tokenEvents.map((event) => event.token).join("");
    expect(fullAnswer).toContain("製造販売業には許可が必要です[1]。");
    expect(fullAnswer).toContain("本回答は参考情報であり");

    expect(answerCache.set).toHaveBeenCalledWith(expect.any(String), {
      answer: fullAnswer,
      citations: [hit.citation],
    });

    const assistantAppendCall = sessionRepository.appendMessage.mock.calls.find(
      (call) => call[1].role === "ASSISTANT",
    );
    expect(assistantAppendCall?.[1].content).toBe(fullAnswer);
    expect(assistantAppendCall?.[1].citations).toEqual([hit.citation]);
  });
});
