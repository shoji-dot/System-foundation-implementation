"use client";

import type { QuizResponse } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { ProgressApiError, recordProgress } from "../api/progress";

interface QuizPlayerProps {
  lessonId: string;
  quiz: QuizResponse;
}

/**
 * S12（クイズ/結果）。GET /api/v1/quizzesはcorrectChoiceIdを含めて返す仕様のため、
 * 採点はここ（クライアント側）で行い、結果をPOST /api/v1/progressで送信する
 * （quizzes.controller.tsのコメントと同方針）。
 */
export function QuizPlayer({ lessonId, quiz }: QuizPlayerProps) {
  const { data: session } = useSession();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [progressStatus, setProgressStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const allAnswered = quiz.questions.every((question) => answers[question.id]);
  const correctCount = quiz.questions.filter(
    (question) => answers[question.id] === question.correctChoiceId,
  ).length;
  const scorePercent = Math.round((correctCount / quiz.questions.length) * 100);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!allAnswered) {
      setError("すべての設問に回答してください。");
      return;
    }

    setError(null);
    setSubmitted(true);

    if (!session?.accessToken) {
      setError(
        "セッションが切れています。再度ログインしてください（結果は記録されませんでした）。",
      );
      return;
    }

    setProgressStatus("submitting");
    try {
      await recordProgress(session.accessToken, {
        lessonId,
        status: "COMPLETED",
        score: scorePercent,
      });
      setProgressStatus("done");
    } catch (cause) {
      setError(cause instanceof ProgressApiError ? cause.message : "結果の記録に失敗しました。");
      setProgressStatus("idle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-lg bg-surface p-4">
      <h3 className="text-[16px] font-semibold text-text">{quiz.title}</h3>

      {quiz.questions
        .sort((a, b) => a.order - b.order)
        .map((question, index) => {
          const selected = answers[question.id];
          const isCorrect = selected === question.correctChoiceId;

          return (
            <fieldset key={question.id} className="flex flex-col gap-2">
              <legend className="text-[14px] font-medium text-text">
                問{index + 1}. {question.question}
              </legend>
              <div className="flex flex-col gap-1">
                {question.choices.map((choice) => (
                  <label
                    key={choice.id}
                    className="flex min-h-[44px] items-center gap-2 text-[14px] text-text"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={choice.id}
                      checked={selected === choice.id}
                      disabled={submitted}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: choice.id }))}
                      className="h-5 w-5 accent-accent"
                    />
                    <span>{choice.text}</span>
                    {submitted && choice.id === question.correctChoiceId ? (
                      <span className="text-[13px] font-medium text-accent">（正解）</span>
                    ) : null}
                  </label>
                ))}
              </div>
              {submitted ? (
                <p
                  className={`text-[13px] font-medium ${isCorrect ? "text-accent" : "text-danger"}`}
                >
                  {isCorrect ? "正解です。" : "不正解です。"}
                  {question.explanation ? ` ${question.explanation}` : ""}
                </p>
              ) : null}
            </fieldset>
          );
        })}

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      {submitted ? (
        <div className="flex flex-col gap-1">
          <p className="text-[16px] font-semibold text-text">
            結果: {correctCount} / {quiz.questions.length} 問正解（{scorePercent}点）
          </p>
          {progressStatus === "done" ? (
            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-accent">✓ 進捗として記録しました。</p>
              <Link
                href="/courses/progress"
                className="inline-flex min-h-[44px] w-fit items-center text-[14px] font-medium text-accent hover:underline"
              >
                学習進捗を見る →
              </Link>
            </div>
          ) : progressStatus === "submitting" ? (
            <p className="text-[14px] text-text-secondary">記録中…</p>
          ) : null}
        </div>
      ) : (
        <Button type="submit" disabled={!allAnswered} className="w-fit">
          採点する
        </Button>
      )}
    </form>
  );
}
