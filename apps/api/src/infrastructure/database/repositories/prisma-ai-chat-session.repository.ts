import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type {
  AiChatHistoryMessage,
  AiChatSessionRef,
  AiChatSessionRepository,
  NewAiChatMessage,
  SavedAiChatMessage,
} from "../../../core/domain/ai-chat-session.repository";
import { PrismaService } from "../prisma.service";

/**
 * AiChatSessionRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * ai_chat_sessions / ai_chat_messages（設計書④に列定義は無いためユーザー承認済みで追加）を操作する。
 */
@Injectable()
export class PrismaAiChatSessionRepository implements AiChatSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSessionOwnedByUser(
    sessionId: string,
    userId: string,
  ): Promise<AiChatSessionRef | null> {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    return session;
  }

  async createSession(userId: string, title: string): Promise<AiChatSessionRef> {
    const session = await this.prisma.aiChatSession.create({
      data: { userId, title },
      select: { id: true },
    });
    return session;
  }

  async findRecentMessages(sessionId: string, limit: number): Promise<AiChatHistoryMessage[]> {
    const messages = await this.prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { role: true, content: true },
    });
    // findMany は新しい順で取得しているため、LLMへ渡す時系列順（古い順）へ戻す。
    return messages.reverse();
  }

  async appendMessage(
    sessionId: string,
    message: NewAiChatMessage,
  ): Promise<SavedAiChatMessage> {
    const created = await this.prisma.aiChatMessage.create({
      data: {
        sessionId,
        role: message.role,
        content: message.content,
        citations: (message.citations ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      select: { id: true, createdAt: true },
    });
    // セッションの更新日時を最新化する（@updatedAt により自動更新、S14履歴一覧を updatedAt desc で表示する想定のため）。
    await this.prisma.aiChatSession.update({ where: { id: sessionId }, data: {} });

    return created;
  }
}
