"use client";

import { Button, Input } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { createTag } from "../api/admin-tags";

/** S21「タグ管理」新規作成フォーム（ADMIN/EDITOR限定画面前提、CreateProjectFormと同方針）。 */
export function CreateTagForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (name.trim().length === 0) {
      setError("タグ名を入力してください。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createTag(session.accessToken, { name: name.trim() });
      setName("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "タグの作成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg bg-surface p-4"
    >
      <div className="min-w-[200px] flex-1">
        <Input
          label="タグ名"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "作成中…" : "タグを作成する"}
      </Button>
    </form>
  );
}
