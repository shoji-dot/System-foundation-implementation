import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listCourses } from "@/features/learning/api/courses";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "学習 | 医療機器薬事承認支援アプリ",
};

interface CoursesPageProps {
  searchParams: Promise<{ cursor?: string }>;
}

/**
 * S10（学習コース一覧、設計書⑫「企画〜市販後・リコールまで体系カリキュラム」）。
 * コースは絞り込み条件を持たずorder順の体系カリキュラムとして固定表示するため、
 * regulations一覧のようなフィルタフォームは持たない。
 * 各コースは/courses/[id]（そのコースのレッスン一覧、S11への入口）に遷移する。
 */
export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { cursor } = await searchParams;
  const result = await listCourses(session.accessToken, { cursor });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">学習</h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            企画から市販後・リコールまでの体系カリキュラムで学べます。
          </p>
        </div>
        <Link
          href="/courses/progress"
          className="inline-flex min-h-[44px] items-center text-[14px] font-medium text-accent hover:underline"
        >
          学習進捗を見る →
        </Link>
      </div>

      {result.items.length === 0 ? (
        <p className="text-[14px] text-text-secondary">公開されているコースはありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.items.map((course) => (
            <li key={course.id}>
              <Link
                href={`/courses/${course.id}`}
                className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
              >
                <p className="text-[16px] font-medium text-text">{course.title}</p>
                {course.description ? (
                  <p className="mt-1 text-[14px] text-text-secondary">{course.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.nextCursor ? (
        <Link
          href={`/courses?cursor=${result.nextCursor}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
