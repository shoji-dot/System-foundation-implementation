import type { Metadata } from "next";

import { LegalDocument } from "@/features/legal/components/LegalDocument";
import { SECURITY_POLICY_CONTENT } from "@/features/legal/content/security-policy";

export const metadata: Metadata = {
  title: "情報セキュリティポリシー | 医療機器薬事承認支援アプリ",
};

/** 利用規約・プライバシーポリシーから参照される情報セキュリティ対応の独立ポリシー。 */
export default function SecurityPolicyPage() {
  return <LegalDocument title="情報セキュリティポリシー" content={SECURITY_POLICY_CONTENT} />;
}
