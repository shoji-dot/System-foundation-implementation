import type { SearchScope } from "@yakuji/shared";
import { searchScopeSchema } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { search } from "@/features/search/api/search";
import { SearchResultList } from "@/features/search/components/SearchResultList";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "検索 | 医療機器薬事承認支援アプリ",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; scope?: SearchScope; cursor?: string }>;
}

/**
 * スコープタブの表示名（設計書⑤ ?scope=all|regulation|jmdn|generic-name|learning 準拠）。
 * このタブ表示以外で再利用する見込みが無いため、shared側の共通ラベル集約（REGULATION_TYPE_LABELS等）とは
 * 異なり本ファイル内に閉じたローカル定数とする（YAGNI）。
 */
const SEARCH_SCOPE_LABELS: Record<SearchScope, string> = {
  all: "すべて",
  regulation: "法令",
  jmdn: "JMDNコード",
  "generic-name": "一般的名称",
  learning: "学習コンテンツ",
};

/**
 * S05（統合検索、設計書⑫「検索窓+ファセット+スコープタブ」、⑩ハイブリッド検索の基本UI）。
 * learningスコープは courses/lessons が検索対象未実装のため常に空配列（バックエンドの既存挙動、
 * searchScopeSchemaのコメントと同じ方針）。タグ絞り込みはtags/taggings未実装のため対象外。
 * S06/S08と同様、`<form method="get">`によるサーバーコンポーネントのままの実装とする。
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { q, cursor, scope: scopeParam } = await searchParams;
  const scope = searchScopeSchema.catch("all").parse(scopeParam);
  const result = await search(session.accessToken, { q, scope, cursor });

  const nextPageQuery = new URLSearchParams();
  if (q) {
    nextPageQuery.set("q", q);
  }
  nextPageQuery.set("scope", scope);
  if (result.nextCursor) {
    nextPageQuery.set("cursor", result.nextCursor);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">検索</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          法令・機器分類を横断してキーワードで検索できます。
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4 rounded-lg bg-surface p-4">
        <input type="hidden" name="scope" value={scope} />
        <label className="flex flex-1 flex-col gap-1 text-[14px] text-text">
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

      <nav aria-label="検索スコープ" className="flex flex-wrap gap-2">
        {Object.entries(SEARCH_SCOPE_LABELS).map(([value, label]) => {
          const tabQuery = new URLSearchParams();
          if (q) {
            tabQuery.set("q", q);
          }
          tabQuery.set("scope", value);

          return (
            <Link
              key={value}
              href={`/search?${tabQuery.toString()}`}
              aria-current={value === scope ? "page" : undefined}
              className={[
                "inline-flex min-h-[44px] items-center rounded-sm border px-4 text-[14px] font-medium",
                value === scope
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-bg text-text",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <SearchResultList items={result.items} />

      {result.nextCursor ? (
        <Link
          href={`/search?${nextPageQuery.toString()}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
