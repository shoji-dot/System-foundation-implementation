import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getLessonDetail, LessonApiError } from "@/features/learning/api/lessons";
import { listQuizzesByLesson } from "@/features/learning/api/quizzes";
import { LessonCompletionButton } from "@/features/learning/components/LessonCompletionButton";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "レッスン | 医療機器薬事承認支援アプリ",
};

interface LessonDetailPageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

/** 404(存在しないレッスン)の場合はnotFound()を呼ぶ（RegulationDetailPageと同じ方針）。 */
async function loadLesson(accessToken: string, lessonId: string) {
  try {
    return await getLessonDetail(accessToken, lessonId);
  } catch (cause) {
    if (cause instanceof LessonApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/**
 * S11（レッスン、設計書⑫「本文・図解・関連法令リンク」）。
 * 図解・関連法令リンクはバックエンド未実装のため今回は対象外（tags/taggings実装時に対応、
 * lessonDetailResponseSchemaのコメントと同じ方針）。
 * クイズはこのレッスンに紐づくものが存在する場合のみ、S12への遷移リンクを表示する。
 */
export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id: courseId, lessonId } = await params;
  const lesson = await loadLesson(session.accessToken, lessonId);
  const quizzes = await listQuizzesByLesson(session.accessToken, lessonId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <Link href={`/courses/${courseId}`} className="text-[14px] text-accent hover:underline">
        ← コースに戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">{lesson.title}</h1>
      </div>

      <section>
        <p className="rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap text-text">
          {lesson.body}
        </p>
      </section>

      <LessonCompletionButton lessonId={lesson.id} />

      {quizzes.items.length > 0 ? (
        <Link
          href={`/courses/${courseId}/lessons/${lessonId}/quiz`}
          className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-sm bg-accent px-4 text-[16px] font-medium text-white hover:opacity-90"
        >
          理解度クイズに挑戦する
        </Link>
      ) : null}
    </main>
  );
}
