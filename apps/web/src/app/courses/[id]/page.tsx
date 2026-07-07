import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CourseApiError, getCourseDetail } from "@/features/learning/api/courses";
import { listLessons } from "@/features/learning/api/lessons";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "コース詳細 | 医療機器薬事承認支援アプリ",
};

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

/**
 * 404(存在しないコース)の場合はnotFound()を呼ぶ。それ以外のエラーはそのまま再送出し、
 * Next.jsの最寄りのerror境界に処理を委ねる（RegulationDetailPageと同じ方針）。
 */
async function loadCourseWithLessons(accessToken: string, courseId: string, cursor?: string) {
  try {
    const [course, lessons] = await Promise.all([
      getCourseDetail(accessToken, courseId),
      listLessons(accessToken, { courseId, cursor }),
    ]);
    return { course, lessons };
  } catch (cause) {
    if (cause instanceof CourseApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/**
 * S10続き（コース詳細、レッスン一覧）。設計書のS-番号一覧には無いが、コースには複数のレッスンが
 * 属するため（S06一覧→S07詳細と異なり）S10とS11の間には一覧が必要（regulationsのversions同様、
 * 親リソース詳細に子リソース一覧を内包する構成）。各レッスンは/courses/[id]/lessons/[lessonId]
 * （S11本文表示）に遷移する。
 */
export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const { cursor } = await searchParams;
  const { course, lessons } = await loadCourseWithLessons(session.accessToken, id, cursor);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <Link href="/courses" className="text-[14px] text-accent hover:underline">
        ← 学習に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">{course.title}</h1>
        {course.description ? (
          <p className="mt-2 text-[14px] text-text-secondary">{course.description}</p>
        ) : null}
      </div>

      <section>
        <h2 className="mb-2 text-[18px] font-semibold text-text">レッスン</h2>
        {lessons.items.length === 0 ? (
          <p className="text-[14px] text-text-secondary">
            このコースにはまだレッスンがありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {lessons.items.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${id}/lessons/${lesson.id}`}
                  className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
                >
                  <p className="text-[16px] font-medium text-text">{lesson.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {lessons.nextCursor ? (
          <Link
            href={`/courses/${id}?cursor=${lessons.nextCursor}`}
            className="mt-4 inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
          >
            次のページ
          </Link>
        ) : null}
      </section>
    </main>
  );
}
