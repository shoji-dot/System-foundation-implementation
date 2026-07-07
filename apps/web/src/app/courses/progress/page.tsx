import { PROGRESS_STATUS_LABELS } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listLearningProgress } from "@/features/learning/api/progress";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "学習進捗 | 医療機器薬事承認支援アプリ",
};

interface LearningProgressPageProps {
  searchParams: Promise<{ cursor?: string }>;
}

/**
 * S13（学習進捗、設計書⑫「修了状況・スコア」）。
 * GET /api/v1/progressは設計書⑤に明記は無いが、レッスン単位のスコア・完了日時を一覧表示するために
 * ユーザー承認済みで追加（S04の集計ウィジェットとは別に、レッスンごとの内訳を確認できるようにする）。
 */
export default async function LearningProgressPage({ searchParams }: LearningProgressPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { cursor } = await searchParams;
  const result = await listLearningProgress(session.accessToken, { cursor });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <Link href="/courses" className="text-[14px] text-accent hover:underline">
        ← 学習に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">学習進捗</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          レッスンごとの修了状況・スコアを確認できます。
        </p>
      </div>

      {result.items.length === 0 ? (
        <p className="text-[14px] text-text-secondary">まだ学習を開始していません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.items.map((item) => (
            <li key={item.id} className="rounded-lg bg-surface p-4">
              <Link
                href={`/courses/${item.courseId}/lessons/${item.lessonId}`}
                className="block min-h-[44px] hover:opacity-90"
              >
                <p className="text-[16px] font-medium text-text">{item.lessonTitle}</p>
                <p className="mt-1 text-[14px] text-text-secondary">
                  {item.courseTitle} ・ {PROGRESS_STATUS_LABELS[item.status]}
                  {item.score !== null ? ` ・ スコア: ${item.score}点` : ""}
                  {item.completedAt
                    ? ` ・ 完了日: ${new Date(item.completedAt).toLocaleDateString("ja-JP")}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.nextCursor ? (
        <Link
          href={`/courses/progress?cursor=${result.nextCursor}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
