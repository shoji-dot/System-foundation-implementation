import type { UpdateFeedItemResponse } from "@yakuji/shared";
import Link from "next/link";

interface UpdateFeedWidgetProps {
  items: UpdateFeedItemResponse[];
  errorMessage: string | null;
}

/**
 * S04「更新フィード」ウィジェット（設計書⑫、GET /api/v1/updates の最新n件）。
 * 「すべて見る」でS17（更新情報フィード一覧、`/updates`）へ遷移する。
 * 項目タップでS07（法令詳細）へ遷移する（設計書⑬「S17 ─ S07（新着タップ）」に準拠、S07実装済み）。
 */
export function UpdateFeedWidget({ items, errorMessage }: UpdateFeedWidgetProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text">更新フィード</h2>
        <Link
          href="/updates"
          className="flex min-h-[44px] items-center text-[14px] font-medium text-accent hover:underline"
        >
          すべて見る
        </Link>
      </div>
      {errorMessage ? (
        <p className="text-[14px] text-danger">{errorMessage}</p>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-text-secondary">新着の法規制情報はありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.versionId} className="border-b border-border pb-3 last:border-none">
              <Link href={`/regulations/${item.regulationId}`} className="block min-h-[44px]">
                <p className="text-[14px] font-medium text-text">{item.title}</p>
                <p className="text-[13px] text-text-secondary">
                  {item.jurisdiction.name} ・ {item.effectiveFrom}
                  {item.changeSummary ? ` ・ ${item.changeSummary}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
