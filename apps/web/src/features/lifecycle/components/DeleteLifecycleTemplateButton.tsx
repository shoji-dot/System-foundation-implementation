"use client";

import { Button } from "@yakuji/ui";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { deleteLifecycleTemplate } from "../api/admin-lifecycle-templates";

export interface DeleteLifecycleTemplateButtonProps {
  templateId: string;
  /** typedRoutes(next.config.ts)に対応するため`Route`型で固定の既知ルートのみ許可する（GlobalNavと同方針）。 */
  redirectTo: Route;
}

/** S22 工程マスタ詳細の「削除」ボタン（DRAFTのみ表示される画面前提、破壊的操作のため確認を挟む）。 */
export function DeleteLifecycleTemplateButton({
  templateId,
  redirectTo,
}: DeleteLifecycleTemplateButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteLifecycleTemplate(session.accessToken, templateId);
      router.push(redirectTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "削除に失敗しました。");
      setIsDeleting(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
          削除する
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
        この工程マスタ（下書き）を削除します。よろしいですか？
      </p>
      <div className="flex gap-3">
        <Button type="button" variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "削除中…" : "削除を確定する"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setConfirming(false)}
          disabled={isDeleting}
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
