import type { Metadata } from "next";

import { LegalDocument } from "@/features/legal/components/LegalDocument";
import { TERMS_CONTENT } from "@/features/legal/content/terms";

export const metadata: Metadata = {
  title: "利用規約 | 医療機器薬事承認支援アプリ",
};

/** 設計書Phase6「利用規約」対応。法務レビュー未了のv1.0ドラフトを掲載する（本文はLegalDocument参照）。 */
export default function TermsPage() {
  return <LegalDocument title="利用規約" content={TERMS_CONTENT} />;
}
