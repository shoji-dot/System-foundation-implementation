import type { AiChatCitation, AiChatMessage, AiChatMessageRole } from "./ai-chat.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaAiChatSessionRepository）。
 * ai_chat_sessions / ai_chat_messages（設計書④に列定義は無いためユーザー承認済みで追加、S14「履歴」表示用）の永続化を担う。
 */
export const AI_CHAT_SESSION_REPOSITORY = Symbol("AI_CHAT_SESSION_REPOSITORY");

export interface AiChatSessionRef {
  id: string;
}

export interface NewAiChatMessage {
  role: AiChatMessageRole;
  content: string;
  citations: AiChatCitation[] | null;
}

export interface SavedAiChatMessage {
  id: string;
  createdAt: Date;
}

export interface AiChatHistoryMessage {
  role: AiChatMessageRole;
  content: string;
}

export interface AiChatSessionSummary {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiChatSessionListResult {
  items: AiChatSessionSummary[];
  nextCursor: string | null;
}

export interface AiChatMessageListResult {
  items: AiChatMessage[];
  nextCursor: string | null;
}

export interface AiChatSessionRepository {
  /** ログイン中ユーザー自身が所有するセッションのみ返す（他ユーザーのセッションへのアクセスを防ぐ）。 */
  findSessionOwnedByUser(sessionId: string, userId: string): Promise<AiChatSessionRef | null>;
  /** title は先頭メッセージから生成し、以後は変更しない（S14履歴一覧の表示ラベル用）。 */
  createSession(userId: string, title: string): Promise<AiChatSessionRef>;
  /** マルチターン文脈用に直近N件を古い順で返す（LLMへのメッセージ列構築に使う）。 */
  findRecentMessages(sessionId: string, limit: number): Promise<AiChatHistoryMessage[]>;
  appendMessage(sessionId: string, message: NewAiChatMessage): Promise<SavedAiChatMessage>;
  /**
   * ログイン中ユーザー自身のセッション一覧（S14「履歴」表示、GET /api/v1/ai/chat/sessions）。
   * id（UUIDv7、生成順に単調増加）降順のキーセットページネーション（他の一覧APIと同方針）。
   */
  findManyForUser(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<AiChatSessionListResult>;
  /**
   * セッション内メッセージ一覧（S14「履歴」表示、GET /api/v1/ai/chat/sessions/:id/messages）。
   * id降順（新しい順）のキーセットページネーション。所有権チェックは呼び出し側（usecase）が
   * findSessionOwnedByUser で行う前提。
   */
  findMessages(
    sessionId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<AiChatMessageListResult>;
}
