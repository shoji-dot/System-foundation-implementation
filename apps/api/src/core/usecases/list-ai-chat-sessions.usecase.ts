import { Inject, Injectable } from "@nestjs/common";

import { AI_CHAT_SESSION_REPOSITORY } from "../domain/ai-chat-session.repository";
import type {
  AiChatSessionListResult,
  AiChatSessionRepository,
} from "../domain/ai-chat-session.repository";

export interface ListAiChatSessionsInput {
  userId: string;
  cursor?: string;
  limit: number;
}

/**
 * 設計書⑤に明記は無いがS14「履歴」表示に必要なためユーザー承認済みで追加。
 * GET /api/v1/ai/chat/sessions（ログイン中ユーザー自身のセッション一覧、カーソルページネーション）。
 */
@Injectable()
export class ListAiChatSessionsUsecase {
  constructor(
    @Inject(AI_CHAT_SESSION_REPOSITORY)
    private readonly sessionRepository: AiChatSessionRepository,
  ) {}

  async execute(input: ListAiChatSessionsInput): Promise<AiChatSessionListResult> {
    return this.sessionRepository.findManyForUser(input.userId, input.cursor, input.limit);
  }
}
