import type { SearchResultItemResponse } from "@yakuji/shared";
import { CLASSIFICATION_SCHEME_LABELS, REGULATION_TYPE_LABELS } from "@yakuji/shared";
import Link from "next/link";

interface SearchResultListProps {
  items: SearchResultItemResponse[];
}

/**
 * S05「検索窓+ファセット+スコープタブ」の結果一覧。regulation/classificationのdiscriminated unionを
 * それぞれS07（法令詳細）・S09（分類詳細）へのリンクとして表示する（設計書⑬「どの画面からも法令詳細S07へ
 * 2タップ以内で到達」）。サーバーコンポーネント（インタラクションを持たない純粋な表示）。
 */
export function SearchResultList({ items }: SearchResultListProps) {
  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">該当する結果はありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={`${item.type}-${item.id}`}>
          {item.type === "regulation" ? (
            <Link
              href={`/regulations/${item.id}`}
              className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
            >
              <p className="text-[16px] font-medium text-text">{item.title}</p>
              <p className="mt-1 text-[14px] text-text-secondary">
                法令 ・ {item.jurisdiction.name} ・ {REGULATION_TYPE_LABELS[item.regulationType]}
                {item.effectiveDate ? ` ・ 施行日: ${item.effectiveDate}` : ""}
              </p>
            </Link>
          ) : (
            <Link
              href={`/classifications/${item.id}`}
              className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
            >
              <p className="text-[16px] font-medium text-text">{item.name}</p>
              <p className="mt-1 text-[14px] text-text-secondary">
                機器分類 ・ {CLASSIFICATION_SCHEME_LABELS[item.scheme]} ・ {item.code}
                {item.class ? ` ・ クラス${item.class}` : ""}
                {` ・ ${item.jurisdiction.name}`}
              </p>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
