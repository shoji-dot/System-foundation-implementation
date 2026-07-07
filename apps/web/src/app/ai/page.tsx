import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/shared/auth/auth";
import { ComingSoonPage } from "@/shared/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "AIチャット | 医療機器薬事承認支援アプリ",
};

/**
 * S14（AIチャット、設計書⑫「RAG QA・出典表示・履歴」）。
 * Phase3（AI機能）はLLM/embeddingプロバイダ未確定のため保留中。バックエンド・フロントエンドともに未実装。
 */
export default async function AiChatPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <ComingSoonPage
      title="AIチャット"
      description="薬事に関する質問にAIが出典付きで回答できるようになります。"
    />
  );
}
