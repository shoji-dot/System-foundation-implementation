"use client";

import type { AiChatCitationResponse } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { ChatApiError, listChatMessages, streamChat } from "../api/chat";

import { CitationList } from "./CitationList";

interface ChatMessageView {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: AiChatCitationResponse[] | null;
}

interface ChatPanelProps {
  /** nullは新規チャット（未送信、セッション未作成）を表す。 */
  sessionId: string | null;
  /** 新規チャットで初回送信が完了しセッションが作成された時に呼ばれる（履歴一覧側の状態更新用）。 */
  onSessionCreated: (sessionId: string) => void;
}

/**
 * S14「AIチャット」本体（設計書⑫「RAG QA・出典表示・履歴」のQA部分）。
 * SSEの生パースはfeatures/ai/api/chat.tsのstreamChatに委譲し、本コンポーネントは表示状態のみ扱う。
 */
export function ChatPanel({ sessionId, onSessionCreated }: ChatPanelProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // sessionId切替（履歴一覧からの選択・新規チャット）に応じて過去メッセージを読み込み直す。
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!sessionId || !session?.accessToken) {
        setMessages([]);
        return;
      }
      setLoadingHistory(true);
      setError(null);
      try {
        const result = await listChatMessages(session.accessToken, sessionId, { limit: 50 });
        if (cancelled) {
          return;
        }
        // GET .../messages はid降順（新しい順）で返るため、会話表示用に古い順へ並べ替える。
        setMessages(
          [...result.items].reverse().map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            citations: message.citations,
          })),
        );
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof ChatApiError ? cause.message : "履歴の読み込みに失敗しました。",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [sessionId, session?.accessToken]);

  // アンマウント時にストリーミング中のfetchを中断する。
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !session?.accessToken || isStreaming) {
      return;
    }

    const userMessageId = `local-user-${Date.now()}`;
    const assistantMessageId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "USER", content: trimmed, citations: null },
      { id: assistantMessageId, role: "ASSISTANT", content: "", citations: null },
    ]);
    setInput("");
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        session.accessToken,
        { sessionId: sessionId ?? undefined, message: trimmed },
        {
          onCitations: (citations) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId ? { ...message, citations } : message,
              ),
            );
          },
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: message.content + token }
                  : message,
              ),
            );
          },
          onDone: (newSessionId) => {
            if (!sessionId) {
              onSessionCreated(newSessionId);
            }
          },
        },
        controller.signal,
      );
    } catch (cause) {
      setError(cause instanceof ChatApiError ? cause.message : "回答の生成に失敗しました。");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto rounded-lg bg-surface p-4"
      >
        {loadingHistory ? (
          <p className="text-[14px] text-text-secondary">読み込み中…</p>
        ) : messages.length === 0 ? (
          <p className="text-[14px] text-text-secondary">
            薬事に関する質問を入力してください。回答には出典（法令・通知等）が付きます。
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-2">
              <p className="text-[13px] font-medium text-text-secondary">
                {message.role === "USER" ? "あなた" : "AI"}
              </p>
              <p className="whitespace-pre-wrap text-[14px] text-text">
                {message.content || (isStreaming ? "…" : "")}
              </p>
              {message.citations ? <CitationList citations={message.citations} /> : null}
            </div>
          ))
        )}
      </div>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          質問を入力
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isStreaming}
          rows={2}
          placeholder="例: 医療機器の製造販売業の許可要件を教えてください"
          className={[
            "min-h-[44px] flex-1 rounded-sm border border-border bg-bg px-3 py-2 text-[16px] text-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          ].join(" ")}
        />
        <Button type="submit" disabled={isStreaming || !input.trim()}>
          送信
        </Button>
      </form>
    </div>
  );
}
