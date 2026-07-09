import type { Metadata } from "next";

import { LegalDocument } from "@/features/legal/components/LegalDocument";
import { PRIVACY_CONTENT } from "@/features/legal/content/privacy";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 医療機器薬事承認支援アプリ",
};

/** 設計書Phase6「利用規約」対応（プライバシーポリシーは利用規約とあわせて整備）。 */
export default function PrivacyPage() {
  return <LegalDocument title="プライバシーポリシー" content={PRIVACY_CONTENT} />;
}
