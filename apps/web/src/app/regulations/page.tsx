import type { JurisdictionCode, RegulationType } from "@yakuji/shared";
import {
  JURISDICTION_CODES,
  JURISDICTION_LABELS,
  REGULATION_STATUS_LABELS,
  REGULATION_TYPE_LABELS,
  REGULATION_TYPES,
} from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listRegulations } from "@/features/regulations/api/regulations";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "法令一覧 | 医療機器薬事承認支援アプリ",
};

interface RegulationsPageProps {
  searchParams: Promise<{
    jurisdiction?: JurisdictionCode;
    type?: RegulationType;
    q?: string;
    cursor?: string;
  }>;
}

/**
 * S06（法令一覧、設計書⑫「国・タイプ別ブラウズ」）。
 * フィルタはサーバーコンポーネントのままURLクエリで表現するため、`<form method="get">`で
 * ページ遷移させる（クライアントJS不要、フィルタ変更時はcursorが自然にリセットされる）。
 */
export default async function RegulationsListPage({ searchParams }: RegulationsPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { jurisdiction, type, q, cursor } = await searchParams;
  const result = await listRegulations(session.accessToken, { jurisdiction, type, q, cursor });

  const nextPageQuery = new URLSearchParams();
  if (jurisdiction) {
    nextPageQuery.set("jurisdiction", jurisdiction);
  }
  if (type) {
    nextPageQuery.set("type", type);
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
        <h1 className="text-2xl font-semibold text-text">法令一覧</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          国・文書種別・キーワードで法規制情報を横断して閲覧できます。
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4 rounded-lg bg-surface p-4">
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
          種別
          <select
            name="type"
            defaultValue={type ?? ""}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">すべて</option>
            {REGULATION_TYPES.map((value) => (
              <option key={value} value={value}>
                {REGULATION_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[14px] text-text">
          キーワード
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
        <p className="text-[14px] text-text-secondary">該当する法規文書はありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.items.map((regulation) => (
            <li key={regulation.id}>
              <Link
                href={`/regulations/${regulation.id}`}
                className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
              >
                <p className="text-[16px] font-medium text-text">{regulation.title}</p>
                <p className="mt-1 text-[14px] text-text-secondary">
                  {regulation.jurisdiction.name} ・ {REGULATION_TYPE_LABELS[regulation.type]} ・{" "}
                  {REGULATION_STATUS_LABELS[regulation.status]}
                  {regulation.effectiveDate ? ` ・ 施行日: ${regulation.effectiveDate}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.nextCursor ? (
        <Link
          href={`/regulations?${nextPageQuery.toString()}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
