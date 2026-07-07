import type { ProgressSummaryResponse } from "@yakuji/shared";
import Link from "next/link";

interface LearningProgressWidgetProps {
  summary: ProgressSummaryResponse | null;
  errorMessage: string | null;
}

/**
 * S04「学習進捗」ウィジェット（設計書⑫、GET /api/v1/progress/summary）。
 * S10（学習コース一覧）実装済みのため「続きから学ぶ」導線を持つ（2026-07-06追加）。
 */
export function LearningProgressWidget({ summary, errorMessage }: LearningProgressWidgetProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-surface p-4">
      <h2 className="text-[16px] font-semibold text-text">学習進捗</h2>
      {errorMessage ? (
        <p className="text-[14px] text-danger">{errorMessage}</p>
      ) : summary && summary.totalLessons > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-[14px] text-text">
            {summary.completedCount} / {summary.totalLessons} レッスン完了
          </p>
          <p className="text-[13px] text-text-secondary">進行中: {summary.inProgressCount}件</p>
        </div>
      ) : (
        <p className="text-[14px] text-text-secondary">まだ学習を開始していません。</p>
      )}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/courses"
          className="inline-flex min-h-[44px] w-fit items-center text-[14px] font-medium text-accent hover:underline"
        >
          続きから学ぶ →
        </Link>
        <Link
          href="/courses/progress"
          className="inline-flex min-h-[44px] w-fit items-center text-[14px] font-medium text-accent hover:underline"
        >
          進捗の詳細を見る →
        </Link>
      </div>
    </section>
  );
}
