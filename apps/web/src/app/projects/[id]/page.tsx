import { JURISDICTION_LABELS } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getProjectDetail,
  listProjectTasks,
  ProjectApiError,
} from "@/features/projects/api/projects";
import { CreateProjectTaskForm } from "@/features/projects/components/CreateProjectTaskForm";
import { ProjectTaskList } from "@/features/projects/components/ProjectTaskList";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "プロジェクト詳細 | 医療機器薬事承認支援アプリ",
};

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 404(存在しない/他ユーザーのプロジェクト)の場合はnotFound()を呼ぶ。それ以外のエラーはそのまま再送出し、
 * Next.jsの最寄りのerror境界に処理を委ねる（IngestionReviewDetailPageと同じ方針）。
 */
async function loadDetail(accessToken: string, projectId: string) {
  try {
    const [project, tasks] = await Promise.all([
      getProjectDetail(accessToken, projectId),
      listProjectTasks(accessToken, projectId),
    ]);
    return { project, tasks };
  } catch (cause) {
    if (cause instanceof ProjectApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/** S16（プロジェクト詳細、設計書⑫「チェックリスト・タスク・期限」）。 */
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const { project, tasks } = await loadDetail(session.accessToken, id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <Link href="/projects" className="text-[14px] text-accent hover:underline">
        ← プロジェクト一覧に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">{project.name}</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          {project.deviceClass ?? "未分類"}
          {project.targetJurisdictions.length > 0
            ? ` ・ ${project.targetJurisdictions.map((code) => JURISDICTION_LABELS[code]).join("、")}`
            : ""}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] font-semibold text-text">タスク</h2>
        <CreateProjectTaskForm projectId={project.id} />
        <ProjectTaskList projectId={project.id} items={tasks.items} />
      </section>
    </main>
  );
}
