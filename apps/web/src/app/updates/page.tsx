import type { JurisdictionCode, RegulationType } from "@yakuji/shared";
import {
  JURISDICTION_CODES,
  JURISDICTION_LABELS,
  REGULATION_TYPE_LABELS,
  REGULATION_TYPES,
} from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listUpdateFeed } from "@/features/notifications/api/updates";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "更新情報フィード | 医療機器薬事承認支援アプリ",
};

interface UpdatesPageProps {
  searchParams: Promise<{
    jurisdiction?: JurisdictionCode;
    type?: RegulationType;
    cursor?: string;
  }>;
}

/**
 * S17（更新情報フィード、設計書⑫「国別新着・改正、購読設定」）。
 * S06/S08と同様、フィルタは`<form method="get">`によるサーバーコンポーネントのままの実装とする
 * （クライアントJS不要、フィルタ変更時はcursorが自然にリセットされる）。
 * 項目タップでS07（法令詳細）へ遷移（設計書⑬「S17 ─ S07（新着タップ）」）。
 * 購読設定（S18、頻度・国・タイプ）は別画面`/settings/notifications`へのリンクのみ持つ
 * （設計書⑬「S17 ─ ... ／ S18」、購読の新規登録フォーム自体はS18側の既存実装を再利用）。
 */
export default async function UpdatesPage({ searchParams }: UpdatesPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { jurisdiction, type, cursor } = await searchParams;
  const result = await listUpdateFeed(session.accessToken, { jurisdiction, type, cursor });

  const nextPageQuery = new URLSearchParams();
  if (jurisdiction) {
    nextPageQuery.set("jurisdiction", jurisdiction);
  }
  if (type) {
    nextPageQuery.set("type", type);
  }
  if (result.nextCursor) {
    nextPageQuery.set("cursor", result.nextCursor);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">更新情報フィード</h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            国・文書種別ごとの法規制の新着・改正情報を確認できます。
          </p>
        </div>
        <Link
          href="/settings/notifications"
          className="inline-flex min-h-[44px] items-center rounded-sm border border-border px-4 text-[14px] font-medium text-text"
        >
          購読設定
        </Link>
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

        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-accent px-4 text-[16px] font-medium text-white"
        >
          絞り込み
        </button>
      </form>

      {result.items.length === 0 ? (
        <p className="text-[14px] text-text-secondary">該当する新着・改正情報はありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.items.map((item) => (
            <li key={item.versionId}>
              <Link
                href={`/regulations/${item.regulationId}`}
                className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
              >
                <p className="text-[16px] font-medium text-text">{item.title}</p>
                <p className="mt-1 text-[14px] text-text-secondary">
                  {item.jurisdiction.name} ・ {REGULATION_TYPE_LABELS[item.type]} ・ 施行日:{" "}
                  {item.effectiveFrom}
                  {item.changeSummary ? ` ・ ${item.changeSummary}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.nextCursor ? (
        <Link
          href={`/updates?${nextPageQuery.toString()}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
