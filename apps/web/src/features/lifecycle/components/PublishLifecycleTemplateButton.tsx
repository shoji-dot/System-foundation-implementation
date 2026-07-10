"use client";

import { Button } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { publishLifecycleTemplate } from "../api/admin-lifecycle-templates";

export interface PublishLifecycleTemplateButtonProps {
  templateId: string;
  templateLabel: string;
}

/**
 * S22 工程マスタ詳細の「公開」ボタン（設計変更書③「DRAFT→PUBLISHED、不可逆」、
 * PublishVersionButton(S20)と同方針で確認ダイアログを挟む）。
 */
export function PublishLifecycleTemplateButton({
  templateId,
  templateLabel,
}: PublishLifecycleTemplateButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handlePublish = async () => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      await publishLifecycleTemplate(session.accessToken, templateId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "公開に失敗しました。");
      setIsPublishing(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={() => setConfirming(true)}>
          公開する
        </Button>
        {error ? (
          <p role="alert" className="text-[14px] text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border bg-surface p-4">
      <p className="text-[14px] text-text">
        「{templateLabel}」を公開します。公開後の編集・削除はできません。よろしいですか？
      </p>
      <div className="flex gap-3">
        <Button type="button" onClick={handlePublish} disabled={isPublishing}>
          {isPublishing ? "公開中…" : "公開を確定する"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setConfirming(false)}
          disabled={isPublishing}
        >
          キャンセル
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
