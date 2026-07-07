import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getLessonDetail, LessonApiError } from "@/features/learning/api/lessons";
import { listQuizzesByLesson } from "@/features/learning/api/quizzes";
import { QuizPlayer } from "@/features/learning/components/QuizPlayer";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "クイズ | 医療機器薬事承認支援アプリ",
};

interface QuizPageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

/** 404(存在しないレッスン、またはクイズが無いレッスン)の場合はnotFound()を呼ぶ。 */
async function loadLessonWithQuizzes(accessToken: string, lessonId: string) {
  try {
    const [lesson, quizzes] = await Promise.all([
      getLessonDetail(accessToken, lessonId),
      listQuizzesByLesson(accessToken, lessonId),
    ]);
    if (quizzes.items.length === 0) {
      notFound();
    }
    return { lesson, quizzes };
  } catch (cause) {
    if (cause instanceof LessonApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/**
 * S12（クイズ/結果、設計書⑫「理解度確認」）。
 * このレッスンにクイズが無い場合はnotFound()（S11のリンクは件数>0の時のみ表示するため、
 * 通常は起こらないが直接URLアクセスされた場合の防御として扱う）。
 */
export default async function QuizPage({ params }: QuizPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id: courseId, lessonId } = await params;
  const { lesson, quizzes } = await loadLessonWithQuizzes(session.accessToken, lessonId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <Link
        href={`/courses/${courseId}/lessons/${lessonId}`}
        className="text-[14px] text-accent hover:underline"
      >
        ← {lesson.title}に戻る
      </Link>

      <h1 className="text-2xl font-semibold text-text">理解度クイズ</h1>

      <div className="flex flex-col gap-6">
        {quizzes.items.map((quiz) => (
          <QuizPlayer key={quiz.id} lessonId={lessonId} quiz={quiz} />
        ))}
      </div>
    </main>
  );
}
