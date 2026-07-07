import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { listProjects } from "@/features/projects/api/projects";
import { CreateProjectForm } from "@/features/projects/components/CreateProjectForm";
import { ProjectList } from "@/features/projects/components/ProjectList";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "プロジェクト一覧 | 医療機器薬事承認支援アプリ",
};

interface ProjectsPageProps {
  searchParams: Promise<{ cursor?: string }>;
}

/**
 * S15（プロジェクト一覧、設計書⑫「実務支援（申請案件）」）。ログイン済みユーザーであれば誰でも利用可能
 * （S20管理画面と異なりRBACの対象外、設計書⑦の一般ユーザー機能）。
 * S16（プロジェクト詳細・チェックリスト・タスク・期限）は未実装のため、一覧項目からの遷移は今回のスコープ外。
 */
export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { cursor } = await searchParams;
  const result = await listProjects(session.accessToken, { cursor });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">プロジェクト</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          承認申請の案件ごとに、対象国・機器クラスを管理できます。
        </p>
      </div>

      <CreateProjectForm />

      <ProjectList items={result.items} nextCursor={result.nextCursor} />
    </main>
  );
}
