"use client";

import type { LifecycleTemplateSummaryResponse } from "@yakuji/shared";
import { LIFECYCLE_DEVICE_CATEGORY_LABELS, LIFECYCLE_TEMPLATE_STATUS_LABELS } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { deleteLifecycleTemplate } from "../api/admin-lifecycle-templates";

interface LifecycleTemplateTableProps {
  items: LifecycleTemplateSummaryResponse[];
}

/**
 * S22（工程マスタ管理）一覧テーブル。編集は詳細ページ（/admin/lifecycle-templates/:id）へ遷移して行う
 * （工程一覧の入れ子構造をテーブル行内で編集するのは非現実的なため、CourseTableとは異なり行内編集は持たない）。
 * 削除はDRAFTのみAPI側で許可されるため、PUBLISHED行にはボタンを出さない。
 */
export function LifecycleTemplateTable({ items }: LifecycleTemplateTableProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">工程マスタがまだ登録されていません。</p>;
  }

  const handleDelete = async (templateId: string) => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setPendingId(templateId);
    setError(null);

    try {
      await deleteLifecycleTemplate(session.accessToken, templateId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "工程マスタの削除に失敗しました。");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
      <table className="w-full border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th scope="col" className="py-2 pr-4 font-medium">
              法域
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              機器種別
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              手続き種別
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              状態
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              版
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((template) => {
            const isPending = pendingId === template.id;
            return (
              <tr key={template.id} className="border-b border-border">
                <td className="py-3 pr-4 text-text">{template.jurisdiction.name}</td>
                <td className="py-3 pr-4 text-text">
                  {LIFECYCLE_DEVICE_CATEGORY_LABELS[template.deviceCategory]}
                </td>
                <td className="py-3 pr-4 text-text">{template.procedureType}</td>
                <td className="py-3 pr-4 text-text">
                  {LIFECYCLE_TEMPLATE_STATUS_LABELS[template.status]}
                </td>
                <td className="py-3 pr-4 text-text">{template.version}</td>
                <td className="py-3 pr-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/lifecycle-templates/${template.id}`}
                      className="inline-flex min-h-[44px] items-center rounded-sm border border-border px-3 text-[14px] font-medium text-accent underline-offset-2 hover:underline"
                    >
                      {template.status === "DRAFT" ? "編集" : "詳細"}
                    </Link>
                    {template.status === "DRAFT" ? (
                      <Button
                        type="button"
                        variant="danger"
                        disabled={isPending}
                        onClick={() => handleDelete(template.id)}
                      >
                        {isPending ? "削除中…" : "削除"}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
