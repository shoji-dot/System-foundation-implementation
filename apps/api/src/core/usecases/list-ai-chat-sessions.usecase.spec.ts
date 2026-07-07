import type { AiChatSessionRepository } from "../domain/ai-chat-session.repository";

import { ListAiChatSessionsUsecase } from "./list-ai-chat-sessions.usecase";

describe("ListAiChatSessionsUsecase", () => {
  function setup() {
    const sessionRepository: jest.Mocked<AiChatSessionRepository> = {
      findSessionOwnedByUser: jest.fn(),
      createSession: jest.fn(),
      findRecentMessages: jest.fn(),
      appendMessage: jest.fn(),
      findManyForUser: jest.fn(),
      findMessages: jest.fn(),
    };
    const usecase = new ListAiChatSessionsUsecase(sessionRepository);
    return { usecase, sessionRepository };
  }

  it("delegates to the repository with the requesting user's id", async () => {
    const { usecase, sessionRepository } = setup();
    sessionRepository.findManyForUser.mockResolvedValue({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          title: "製造販売業の許可について",
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
          updatedAt: new Date("2026-07-07T00:10:00.000Z"),
        },
      ],
      nextCursor: null,
    });

    const result = await usecase.execute({ userId: "u1", cursor: "c1", limit: 20 });

    expect(sessionRepository.findManyForUser).toHaveBeenCalledWith("u1", "c1", 20);
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });
});
