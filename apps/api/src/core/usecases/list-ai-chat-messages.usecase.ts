import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AI_CHAT_SESSION_REPOSITORY } from "../domain/ai-chat-session.repository";
import type {
  AiChatMessageListResult,
  AiChatSessionRepository,
} from "../domain/ai-chat-session.repository";

export interface ListAiChatMessagesInput {
  userId: string;
  sessionId: string;
  cursor?: string;
  limit: number;
}

/**
 * 設計書⑤に明記は無いがS14「履歴」表示（セッション内メッセージ）に必要なためユーザー承認済みで追加。
 * GET /api/v1/ai/chat/sessions/:id/messages。所有権チェック後、id降順（新しい順）で返す。
 */
@Injectable()
export class ListAiChatMessagesUsecase {
  constructor(
    @Inject(AI_CHAT_SESSION_REPOSITORY)
    private readonly sessionRepository: AiChatSessionRepository,
  ) {}

  async execute(input: ListAiChatMessagesInput): Promise<AiChatMessageListResult> {
    const session = await this.sessionRepository.findSessionOwnedByUser(
      input.sessionId,
      input.userId,
    );
    if (!session) {
      throw new NotFoundException("指定されたチャットセッションが見つかりません。");
    }

    return this.sessionRepository.findMessages(input.sessionId, input.cursor, input.limit);
  }
}
