import type { Metadata } from "next";

import { LegalDocument } from "@/features/legal/components/LegalDocument";
import { AI_POLICY_CONTENT } from "@/features/legal/content/ai-policy";

export const metadata: Metadata = {
  title: "AI利用ポリシー | 医療機器薬事承認支援アプリ",
};

/**
 * 生成AI機能（AIチャット・RAG検索・AIレビュー支援等）の限界・保証の否認・検証義務を
 * 定める独立ポリシー。設計書には個別画面定義が無いが、利用規約第7条〜第10条・第16条から
 * 参照される前提のため、利用規約・プライバシーポリシーと合わせて追加。
 */
export default function AiPolicyPage() {
  return <LegalDocument title="AI利用ポリシー" content={AI_POLICY_CONTENT} />;
}
