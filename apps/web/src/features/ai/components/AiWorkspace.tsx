"use client";

import type { AiChatSessionResponse } from "@yakuji/shared";
import { useState } from "react";

import { ChatPanel } from "./ChatPanel";
import { ClassifyPanel } from "./ClassifyPanel";
import { SessionHistoryList } from "./SessionHistoryList";

type AiTab = "chat" | "classify";

interface AiWorkspaceProps {
  initialSessions: AiChatSessionResponse[];
}

const TABS: { id: AiTab; label: string }[] = [
  { id: "chat", label: "チャット" },
  { id: "classify", label: "分類支援" },
];

/**
 * S14（AIチャット・分類支援）オーケストレーター。
 * 設計書のS01〜S21一覧に分類支援専用の画面番号が存在しないため、ユーザー承認のとおりS14内のタブ切替えとする。
 */
export function AiWorkspace({ initialSessions }: AiWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AiTab>("chat");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block">
        <SessionHistoryList
          initialSessions={initialSessions}
          selectedSessionId={selectedSessionId}
          onSelect={setSelectedSessionId}
          refreshKey={historyRefreshKey}
        />
      </aside>

      <div className="flex min-h-[60vh] flex-col gap-4">
        <div role="tablist" aria-label="AI機能" className="flex gap-2 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "min-h-[44px] border-b-2 px-4 text-[15px] font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === "chat" ? (
            <ChatPanel
              sessionId={selectedSessionId}
              onSessionCreated={(newSessionId) => {
                setSelectedSessionId(newSessionId);
                setHistoryRefreshKey((key) => key + 1);
              }}
            />
          ) : (
            <ClassifyPanel />
          )}
        </div>
      </div>
    </div>
  );
}
