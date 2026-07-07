"use client";

import type { ProjectTaskResponse, TaskStatus } from "@yakuji/shared";
import { TASK_STATUS_LABELS, taskStatusSchema } from "@yakuji/shared";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { updateProjectTaskStatus } from "../api/projects";

interface ProjectTaskListProps {
  projectId: string;
  items: ProjectTaskResponse[];
}

/** S16「チェックリスト・タスク・期限」のタスク一覧。ステータスはドロップダウンから変更する。 */
export function ProjectTaskList({ projectId, items }: ProjectTaskListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setUpdatingId(taskId);
    setError(null);

    try {
      await updateProjectTaskStatus(session.accessToken, projectId, taskId, status);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "タスクの更新に失敗しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">タスクはまだ登録されていません。</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((task) => (
          <li
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface p-4"
          >
            <div>
              <p className="text-[16px] font-medium text-text">{task.title}</p>
              <p className="mt-1 text-[14px] text-text-secondary">
                {task.dueDate ? `期限: ${task.dueDate}` : "期限: 未設定"}
                {task.assignee ? ` ・ 担当: ${task.assignee}` : ""}
              </p>
            </div>

            <label className="flex min-h-[44px] items-center gap-2 text-[14px] text-text">
              <span className="sr-only">{task.title}のステータス</span>
              <select
                value={task.status}
                disabled={updatingId === task.id}
                onChange={(event) =>
                  handleStatusChange(task.id, taskStatusSchema.parse(event.target.value))
                }
                className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
