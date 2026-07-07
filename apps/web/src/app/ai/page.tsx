import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { listChatSessions } from "@/features/ai/api/chat";
import { AiWorkspace } from "@/features/ai/components/AiWorkspace";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "AIチャット | 医療機器薬事承認支援アプリ",
};

/**
 * S14（AIチャット・分類支援、設計書⑤⑥⑫「RAG QA・出典表示・履歴」）。
 * 初期表示分の履歴一覧のみサーバー側で取得し、以降のやり取り（送信・タブ切替え・履歴切替え）は
 * クライアントコンポーネント（AiWorkspace）に委譲する。
 */
export default async function AiChatPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const initialSessions = await listChatSessions(session.accessToken, { limit: 20 });

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">AIチャット</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          薬事に関する質問への出典付き回答、および機器概要からの分類候補提示を行います。
        </p>
      </div>
      <AiWorkspace initialSessions={initialSessions.items} />
    </main>
  );
}
