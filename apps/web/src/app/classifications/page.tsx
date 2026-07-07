import type { ClassificationScheme, JurisdictionCode } from "@yakuji/shared";
import {
  CLASSIFICATION_SCHEME_LABELS,
  CLASSIFICATION_SCHEMES,
  JURISDICTION_CODES,
  JURISDICTION_LABELS,
} from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listClassifications } from "@/features/classifications/api/classifications";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "JMDN検索 | 医療機器薬事承認支援アプリ",
};

interface ClassificationsPageProps {
  searchParams: Promise<{
    scheme?: ClassificationScheme;
    jurisdiction?: JurisdictionCode;
    q?: string;
    cursor?: string;
  }>;
}

/**
 * S08（一般的名称/JMDN検索、設計書⑫「コード・名称・クラス・各国マッピング」）。
 * 各国マッピングの詳細はS09（/classifications/[id]）で表示するため、本画面は一覧・絞り込みに専念する。
 * S06と同様、フィルタは`<form method="get">`によるサーバーコンポーネントのままの実装とする
 * （クライアントJS不要、フィルタ変更時はcursorが自然にリセットされる）。
 */
export default async function ClassificationsListPage({
  searchParams,
}: ClassificationsPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { scheme, jurisdiction, q, cursor } = await searchParams;
  const result = await listClassifications(session.accessToken, {
    scheme,
    jurisdiction,
    q,
    cursor,
  });

  const nextPageQuery = new URLSearchParams();
  if (scheme) {
    nextPageQuery.set("scheme", scheme);
  }
  if (jurisdiction) {
    nextPageQuery.set("jurisdiction", jurisdiction);
  }
  if (q) {
    nextPageQuery.set("q", q);
  }
  if (result.nextCursor) {
    nextPageQuery.set("cursor", result.nextCursor);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">一般的名称・JMDN検索</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          コード・名称・定義から機器分類を検索し、各国の対応コードを確認できます。
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4 rounded-lg bg-surface p-4">
        <label className="flex flex-col gap-1 text-[14px] text-text">
          スキーム
          <select
            name="scheme"
            defaultValue={scheme ?? ""}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">すべて</option>
            {CLASSIFICATION_SCHEMES.map((value) => (
              <option key={value} value={value}>
                {CLASSIFICATION_SCHEME_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[14px] text-text">
          国
          <select
            name="jurisdiction"
            defaultValue={jurisdiction ?? ""}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">すべて</option>
            {JURISDICTION_CODES.map((code) => (
              <option key={code} value={code}>
                {JURISDICTION_LABELS[code]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[14px] text-text">
          コード・名称
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-accent px-4 text-[16px] font-medium text-white"
        >
          検索
        </button>
      </form>

      {result.items.length === 0 ? (
        <p className="text-[14px] text-text-secondary">該当する機器分類はありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.items.map((classification) => (
            <li key={classification.id}>
              <Link
                href={`/classifications/${classification.id}`}
                className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
              >
                <p className="text-[16px] font-medium text-text">{classification.name}</p>
                <p className="mt-1 text-[14px] text-text-secondary">
                  {CLASSIFICATION_SCHEME_LABELS[classification.scheme]} ・ {classification.code}
                  {classification.class ? ` ・ クラス${classification.class}` : ""}
                  {` ・ ${classification.jurisdiction.name}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.nextCursor ? (
        <Link
          href={`/classifications?${nextPageQuery.toString()}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
