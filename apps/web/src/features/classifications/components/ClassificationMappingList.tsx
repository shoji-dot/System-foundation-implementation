import type { ClassificationMappingResponse } from "@yakuji/shared";
import { CLASSIFICATION_SCHEME_LABELS } from "@yakuji/shared";
import Link from "next/link";

interface ClassificationMappingListProps {
  items: ClassificationMappingResponse[];
}

/**
 * S09「各国マッピング表示」。マッピング先（相手側スキーム）の分類は独立した機器分類のため、
 * タップするとその分類自身の詳細（/classifications/:id）へ遷移できる（再帰的な詳細参照）。
 * サーバーコンポーネント（インタラクションを持たない純粋な表示）。
 */
export function ClassificationMappingList({ items }: ClassificationMappingListProps) {
  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">登録されている各国マッピングはありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((mapping) => (
        <li key={mapping.id}>
          <Link
            href={`/classifications/${mapping.classification.id}`}
            className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
          >
            <p className="text-[14px] font-medium text-text">
              {CLASSIFICATION_SCHEME_LABELS[mapping.classification.scheme]} ・{" "}
              {mapping.classification.code}
            </p>
            <p className="mt-1 text-[14px] text-text">{mapping.classification.name}</p>
            <p className="mt-1 text-[13px] text-text-secondary">
              信頼度: {Math.round(mapping.confidence * 100)}%
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
