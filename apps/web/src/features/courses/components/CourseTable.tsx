"use client";

import type { CourseSummaryResponse } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { deleteCourse, updateCourse } from "../api/admin-courses";

interface CourseTableProps {
  items: CourseSummaryResponse[];
}

interface EditState {
  title: string;
  description: string;
  order: string;
}

/**
 * S21「コース管理」一覧・編集・削除（ADMIN/EDITOR限定画面前提）。
 * 行ごとに編集モードを切り替える方式（UpdateUserRoleSelectのようなセル単位ではなく、
 * コースは複数フィールドを同時編集するため行単位のstateで管理する）。
 */
export function CourseTable({ items }: CourseTableProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">コースがまだ登録されていません。</p>;
  }

  const startEdit = (course: CourseSummaryResponse) => {
    setEditingId(course.id);
    setEditState({
      title: course.title,
      description: course.description ?? "",
      order: String(course.order),
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(null);
  };

  const saveEdit = async (courseId: string) => {
    if (!session?.accessToken || !editState) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (editState.title.trim().length === 0) {
      setError("コース名を入力してください。");
      return;
    }
    const orderValue = Number(editState.order);
    if (!Number.isInteger(orderValue) || orderValue < 0) {
      setError("表示順は0以上の整数で入力してください。");
      return;
    }

    setPendingId(courseId);
    setError(null);

    try {
      await updateCourse(session.accessToken, courseId, {
        title: editState.title.trim(),
        description: editState.description.trim().length > 0 ? editState.description.trim() : null,
        order: orderValue,
      });
      setEditingId(null);
      setEditState(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "コースの更新に失敗しました。");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setPendingId(courseId);
    setError(null);

    try {
      await deleteCourse(session.accessToken, courseId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "コースの削除に失敗しました。");
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
              コース名
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              説明
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              表示順
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((course) => {
            const isPending = pendingId === course.id;

            if (editingId === course.id && editState) {
              return (
                <tr key={course.id} className="border-b border-border align-top">
                  <td className="py-3 pr-4">
                    <label className="sr-only" htmlFor={`course-title-${course.id}`}>
                      コース名
                    </label>
                    <input
                      id={`course-title-${course.id}`}
                      value={editState.title}
                      onChange={(event) =>
                        setEditState({ ...editState, title: event.target.value })
                      }
                      className={[
                        "min-h-[44px] w-full rounded-sm border border-border bg-bg px-3 text-[16px] text-text",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      ].join(" ")}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <label className="sr-only" htmlFor={`course-description-${course.id}`}>
                      説明
                    </label>
                    <textarea
                      id={`course-description-${course.id}`}
                      value={editState.description}
                      onChange={(event) =>
                        setEditState({ ...editState, description: event.target.value })
                      }
                      rows={2}
                      className={[
                        "w-full rounded-sm border border-border bg-bg px-3 py-2 text-[16px] text-text",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      ].join(" ")}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <label className="sr-only" htmlFor={`course-order-${course.id}`}>
                      表示順
                    </label>
                    <input
                      id={`course-order-${course.id}`}
                      type="number"
                      min={0}
                      value={editState.order}
                      onChange={(event) =>
                        setEditState({ ...editState, order: event.target.value })
                      }
                      className={[
                        "min-h-[44px] w-20 rounded-sm border border-border bg-bg px-3 text-[16px] text-text",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      ].join(" ")}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => saveEdit(course.id)}
                        disabled={isPending}
                      >
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
              <tr key={course.id} className="border-b border-border">
                <td className="py-3 pr-4 text-text">{course.title}</td>
                <td className="py-3 pr-4 text-text-secondary">{course.description ?? "—"}</td>
                <td className="py-3 pr-4 text-text">{course.order}</td>
                <td className="py-3 pr-4">
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => startEdit(course)}>
                      編集
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={isPending}
                      onClick={() => handleDelete(course.id)}
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
