import type { RegulationVersionSummaryResponse } from "@yakuji/shared";
import Link from "next/link";

interface RegulationVersionHistoryProps {
  regulationId: string;
  items: RegulationVersionSummaryResponse[];
  nextCursor: string | null;
}

/**
 * S07「版切替」の履歴一覧（改正差分は[[RegulationDiffViewer]]で別途表示）。
 * サーバーコンポーネント（インタラクションを持たない純粋な表示）。
 */
export function RegulationVersionHistory({
  regulationId,
  items,
  nextCursor,
}: RegulationVersionHistoryProps) {
  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">改正履歴はありません。</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {items.map((version) => (
          <li key={version.id} className="rounded-lg bg-surface p-4">
            <p className="text-[14px] font-medium text-text">
              第{version.versionNo}版 ・ 施行日: {version.effectiveFrom}
              {version.effectiveTo ? `〜${version.effectiveTo}` : ""}
            </p>
            {version.summary ? (
              <p className="mt-1 text-[14px] text-text-secondary">{version.summary}</p>
            ) : null}
            {version.changeSummary ? (
              <p className="mt-1 text-[14px] text-text-secondary">{version.changeSummary}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <Link
          href={`/regulations/${regulationId}?versionsCursor=${encodeURIComponent(nextCursor)}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </div>
  );
}
