"use client";

import { Button } from "@yakuji/ui";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { ProgressApiError, recordProgress } from "../api/progress";

interface LessonCompletionButtonProps {
  lessonId: string;
}

/**
 * S11「レッスンを完了にする」操作（POST /api/v1/progress、status: COMPLETED）。
 * このレッスンの既存の進捗状態を取得するGET APIが無いため（設計書⑤に無く未追加）、
 * ページ読み込み時点での完了済み表示は行わず、クリック後の結果のみをその場で表示する。
 */
export function LessonCompletionButton({ lessonId }: LessonCompletionButtonProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      await recordProgress(session.accessToken, { lessonId, status: "COMPLETED" });
      setStatus("done");
    } catch (cause) {
      setError(cause instanceof ProgressApiError ? cause.message : "進捗の記録に失敗しました。");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return <p className="text-[14px] font-medium text-accent">✓ 完了として記録しました。</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        disabled={status === "submitting"}
        className="w-fit"
      >
        {status === "submitting" ? "記録中…" : "レッスンを完了にする"}
      </Button>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
