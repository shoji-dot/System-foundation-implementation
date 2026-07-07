import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type {
  AiChatHistoryMessage,
  AiChatMessageListResult,
  AiChatSessionListResult,
  AiChatSessionRef,
  AiChatSessionRepository,
  NewAiChatMessage,
  SavedAiChatMessage,
} from "../../../core/domain/ai-chat-session.repository";
import type { AiChatCitation, AiChatMessage } from "../../../core/domain/ai-chat.entity";
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
    // セッションの更新日時を最新化する（@updatedAt により自動更新）。一覧の並び順には使わない
    // （findManyForUserはidキーセットのため）が、将来「最終更新」表示等に使えるよう正確に保つ。
    await this.prisma.aiChatSession.update({ where: { id: sessionId }, data: {} });

    return created;
  }

  async findManyForUser(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<AiChatSessionListResult> {
    const records = await this.prisma.aiChatSession.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > limit;
    const page = hasMore ? records.slice(0, limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return { items: page, nextCursor };
  }

  async findMessages(
    sessionId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<AiChatMessageListResult> {
    const records = await this.prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { id: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > limit;
    const page = hasMore ? records.slice(0, limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map(
        (record): AiChatMessage => ({
          id: record.id,
          role: record.role,
          content: record.content,
          citations: this.parseCitations(record.citations),
          createdAt: record.createdAt,
        }),
      ),
      nextCursor,
    };
  }

  /** citations jsonb → ドメイン型。effectiveFrom/effectiveToはJSON往復でISO文字列になるためDateへ戻す
   * （RedisAiChatAnswerCache.getと同じ理由）。 */
  private parseCitations(json: Prisma.JsonValue | null): AiChatCitation[] | null {
    if (json == null) {
      return null;
    }

    const rawCitations = json as unknown as (Omit<
      AiChatCitation,
      "effectiveFrom" | "effectiveTo"
    > & {
      effectiveFrom: string;
      effectiveTo: string | null;
    })[];

    return rawCitations.map((citation) => ({
      ...citation,
      effectiveFrom: new Date(citation.effectiveFrom),
      effectiveTo: citation.effectiveTo ? new Date(citation.effectiveTo) : null,
    }));
  }
}
