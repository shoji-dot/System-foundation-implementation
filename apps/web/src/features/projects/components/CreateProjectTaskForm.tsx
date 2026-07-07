"use client";

import { Button, Input } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { createProjectTask } from "../api/projects";

interface CreateProjectTaskFormProps {
  projectId: string;
}

/**
 * S16「チェックリスト・タスク・期限」のタスク作成フォーム。
 * checklistsマスタは今回作らないため（ユーザー承認済み、[[CreateProjectForm]]と同様の簡略化）、
 * タイトルはユーザー自由入力とする。
 */
export function CreateProjectTaskForm({ projectId }: CreateProjectTaskFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (title.trim().length === 0) {
      setError("タスク名を入力してください。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProjectTask(session.accessToken, projectId, {
        title: title.trim(),
        dueDate: dueDate.length > 0 ? dueDate : undefined,
        assignee: assignee.trim().length > 0 ? assignee.trim() : undefined,
      });
      setTitle("");
      setDueDate("");
      setAssignee("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "タスクの作成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-surface p-4">
      <h2 className="text-[16px] font-semibold text-text">タスクを追加</h2>

      <Input
        label="タスク名"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />

      <div className="flex flex-wrap gap-4">
        <Input
          label="期限（任意）"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <Input
          label="担当者（任意）"
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "追加中…" : "タスクを追加する"}
      </Button>
    </form>
  );
}
