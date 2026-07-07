"use client";

import type { AiChatSessionResponse } from "@yakuji/shared";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { ChatApiError, listChatSessions } from "../api/chat";

interface SessionHistoryListProps {
  initialSessions: AiChatSessionResponse[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string | null) => void;
  /** ChatPanel側で新規チャットの初回送信が完了した際に呼ばれ、一覧を再取得する。 */
  refreshKey: number;
}

/**
 * S14「履歴」一覧（設計書⑤ GET /api/v1/ai/chat/sessions）。新規チャット開始と既存セッション選択を提供する。
 */
export function SessionHistoryList({
  initialSessions,
  selectedSessionId,
  onSelect,
  refreshKey,
}: SessionHistoryListProps) {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<AiChatSessionResponse[]>(initialSessions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (refreshKey === 0 || !session?.accessToken) {
      return;
    }
    let cancelled = false;
    listChatSessions(session.accessToken, { limit: 20 })
      .then((result) => {
        if (!cancelled) {
          setSessions(result.items);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof ChatApiError ? cause.message : "履歴の再取得に失敗しました。");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, session?.accessToken]);

  return (
    <nav aria-label="チャット履歴" className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={[
          "min-h-[44px] rounded-sm px-3 text-left text-[14px] font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          selectedSessionId === null ? "bg-accent text-white" : "text-text hover:bg-surface",
        ].join(" ")}
      >
        + 新規チャット
      </button>

      {error ? (
        <p role="alert" className="px-3 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-1">
        {sessions.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={[
                "min-h-[44px] w-full rounded-sm px-3 text-left text-[14px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                selectedSessionId === item.id
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface",
              ].join(" ")}
            >
              {item.title ?? "無題のチャット"}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
