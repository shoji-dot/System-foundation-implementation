"use client";

import type {
  RegulationDiffResponse,
  RegulationSectionDiffStatus,
  RegulationVersionSummaryResponse,
} from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { getRegulationDiff, RegulationApiError } from "../api/regulations";

interface RegulationDiffViewerProps {
  regulationId: string;
  versions: RegulationVersionSummaryResponse[];
}

const DIFF_STATUS_LABELS: Record<RegulationSectionDiffStatus, string> = {
  added: "新設",
  removed: "削除",
  modified: "改正",
  unchanged: "変更なし",
};

/**
 * S07「改正差分」。versionsは現在ページに読み込まれている版のみを選択肢とする
 * （改正回数が多く複数ページにまたがる法規では、後続ページの版はこのUIからは選択できない。
 * 今回のスコープでは十分なため、全版横断の選択UIは次回検討）。
 */
export function RegulationDiffViewer({ regulationId, versions }: RegulationDiffViewerProps) {
  const { data: session } = useSession();
  const sortedVersions = [...versions].sort((a, b) => a.versionNo - b.versionNo);
  const [from, setFrom] = useState(sortedVersions[0]?.versionNo ?? 1);
  const [to, setTo] = useState(sortedVersions[sortedVersions.length - 1]?.versionNo ?? 1);
  const [result, setResult] = useState<RegulationDiffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sortedVersions.length < 2) {
    return <p className="text-[14px] text-text-secondary">比較できる版が2つ以上ありません。</p>;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (from === to) {
      setError("異なる版を選択してください。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const diff = await getRegulationDiff(session.accessToken, regulationId, from, to);
      setResult(diff);
    } catch (cause) {
      setError(
        cause instanceof RegulationApiError ? cause.message : "改正差分の取得に失敗しました。",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const changedSections = result
    ? result.sections.filter((section) => section.status !== "unchanged")
    : [];

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-[14px] text-text">
          比較元（旧版）
          <select
            value={from}
            onChange={(event) => setFrom(Number(event.target.value))}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {sortedVersions.map((version) => (
              <option key={version.id} value={version.versionNo}>
                第{version.versionNo}版
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[14px] text-text">
          比較先（新版）
          <select
            value={to}
            onChange={(event) => setTo(Number(event.target.value))}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {sortedVersions.map((version) => (
              <option key={version.id} value={version.versionNo}>
                第{version.versionNo}版
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "取得中…" : "差分を見る"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      {result ? (
        changedSections.length === 0 ? (
          <p className="text-[14px] text-text-secondary">選択した版の間に差分はありません。</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {changedSections.map((section) => (
              <li key={section.path} className="rounded-lg bg-surface p-4">
                <p className="text-[14px] font-medium text-text">
                  {section.path} {section.heading}（{DIFF_STATUS_LABELS[section.status]}）
                </p>
                {section.fromBody && section.status !== "added" ? (
                  <p className="mt-2 text-[14px] whitespace-pre-wrap text-danger line-through">
                    {section.fromBody}
                  </p>
                ) : null}
                {section.toBody && section.status !== "removed" ? (
                  <p className="mt-2 text-[14px] font-medium whitespace-pre-wrap text-accent">
                    {section.toBody}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
