"use client";

import { Button } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { publishPendingReviewVersion } from "../api/pending-review";

export interface PublishVersionButtonProps {
  versionId: string;
  regulationTitle: string;
}

/**
 * S20 取込レビュー詳細の「公開」ボタン（設計書⑫、editor/adminのみ表示される画面前提）。
 * クライアントコンポーネント: セッションのaccessTokenでNestJSを直接呼び出す
 * （設計書⑦の方針通り、session.accessTokenは既にクライアントへ公開済みのフィールド）。
 */
export function PublishVersionButton({ versionId, regulationTitle }: PublishVersionButtonProps) {
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
      await publishPendingReviewVersion(session.accessToken, versionId);
      router.push("/admin/ingestion");
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
        「{regulationTitle}」の校閲を完了し、公開します。よろしいですか？
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
