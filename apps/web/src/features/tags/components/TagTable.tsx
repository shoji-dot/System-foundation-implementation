"use client";

import type { TagResponse } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { deleteTag, updateTag } from "../api/admin-tags";

interface TagTableProps {
  items: TagResponse[];
}

/** S21「タグ管理」一覧・編集・削除（ADMIN/EDITOR限定画面前提）。 */
export function TagTable({ items }: TagTableProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">タグがまだ登録されていません。</p>;
  }

  const startEdit = (tag: TagResponse) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (tagId: string) => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (editName.trim().length === 0) {
      setError("タグ名を入力してください。");
      return;
    }

    setPendingId(tagId);
    setError(null);

    try {
      await updateTag(session.accessToken, tagId, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "タグの更新に失敗しました。");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setPendingId(tagId);
    setError(null);

    try {
      await deleteTag(session.accessToken, tagId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "タグの削除に失敗しました。");
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
              タグ名
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((tag) => {
            const isPending = pendingId === tag.id;

            if (editingId === tag.id) {
              return (
                <tr key={tag.id} className="border-b border-border">
                  <td className="py-3 pr-4">
                    <label className="sr-only" htmlFor={`tag-name-${tag.id}`}>
                      タグ名
                    </label>
                    <input
                      id={`tag-name-${tag.id}`}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className={[
                        "min-h-[44px] w-full rounded-sm border border-border bg-bg px-3 text-[16px] text-text",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      ].join(" ")}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <Button type="button" onClick={() => saveEdit(tag.id)} disabled={isPending}>
                        {isPending ? "保存中…" : "保存"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={cancelEdit}
                        disabled={isPending}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={tag.id} className="border-b border-border">
                <td className="py-3 pr-4 text-text">{tag.name}</td>
                <td className="py-3 pr-4">
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => startEdit(tag)}>
                      編集
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={isPending}
                      onClick={() => handleDelete(tag.id)}
                    >
                      {isPending ? "削除中…" : "削除"}
                    </Button>
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
