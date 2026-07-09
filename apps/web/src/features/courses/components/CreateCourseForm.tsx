"use client";

import { Button, Input } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { createCourse } from "../api/admin-courses";

/**
 * S21「コース管理」新規作成フォーム（ADMIN/EDITOR限定画面前提、CreateProjectFormと同方針）。
 */
export function CreateCourseForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (title.trim().length === 0) {
      setError("コース名を入力してください。");
      return;
    }
    const orderValue = Number(order);
    if (!Number.isInteger(orderValue) || orderValue < 0) {
      setError("表示順は0以上の整数で入力してください。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createCourse(session.accessToken, {
        title: title.trim(),
        description: description.trim().length > 0 ? description.trim() : undefined,
        order: orderValue,
      });
      setTitle("");
      setDescription("");
      setOrder("0");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "コースの作成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-surface p-4">
      <h3 className="text-[16px] font-semibold text-text">新規コース作成</h3>

      <Input
        label="コース名"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="new-course-description" className="text-[14px] font-medium text-text">
          説明（任意）
        </label>
        <textarea
          id="new-course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className={[
            "rounded-sm border border-border bg-bg px-3 py-2 text-[16px] text-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          ].join(" ")}
        />
      </div>

      <Input
        label="表示順"
        type="number"
        min={0}
        value={order}
        onChange={(event) => setOrder(event.target.value)}
        required
      />

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "作成中…" : "コースを作成する"}
      </Button>
    </form>
  );
}
