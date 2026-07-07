import type { AiChatSessionRepository } from "../domain/ai-chat-session.repository";

import { ListAiChatMessagesUsecase } from "./list-ai-chat-messages.usecase";

describe("ListAiChatMessagesUsecase", () => {
  const sessionId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c";
  const userId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b";

  function setup() {
    const sessionRepository: jest.Mocked<AiChatSessionRepository> = {
      findSessionOwnedByUser: jest.fn(),
      createSession: jest.fn(),
      findRecentMessages: jest.fn(),
      appendMessage: jest.fn(),
      findManyForUser: jest.fn(),
      findMessages: jest.fn(),
    };
    const usecase = new ListAiChatMessagesUsecase(sessionRepository);
    return { usecase, sessionRepository };
  }

  it("throws NotFoundException when the session does not belong to the requesting user", async () => {
    const { usecase, sessionRepository } = setup();
    sessionRepository.findSessionOwnedByUser.mockResolvedValue(null);

    await expect(usecase.execute({ userId, sessionId, limit: 20 })).rejects.toThrow(
      "指定されたチャットセッションが見つかりません。",
    );
    expect(sessionRepository.findMessages).not.toHaveBeenCalled();
  });

  it("returns messages from the repository once ownership is confirmed", async () => {
    const { usecase, sessionRepository } = setup();
    sessionRepository.findSessionOwnedByUser.mockResolvedValue({ id: sessionId });
    sessionRepository.findMessages.mockResolvedValue({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f",
          role: "ASSISTANT",
          content: "回答本文",
          citations: null,
          createdAt: new Date("2026-07-07T00:10:00.000Z"),
        },
      ],
      nextCursor: null,
    });

    const result = await usecase.execute({ userId, sessionId, cursor: "c1", limit: 20 });

    expect(sessionRepository.findMessages).toHaveBeenCalledWith(sessionId, "c1", 20);
    expect(result.items).toHaveLength(1);
  });
});
