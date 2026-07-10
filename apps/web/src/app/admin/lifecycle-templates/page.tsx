import type { SystemRole } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { listAdminLifecycleTemplates } from "@/features/lifecycle/api/admin-lifecycle-templates";
import { LifecycleTemplateTable } from "@/features/lifecycle/components/LifecycleTemplateTable";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "工程マスタ管理 | 医療機器薬事承認支援アプリ",
};

/** 設計変更書_ライフサイクル管理_SaaS化.md① S22はeditor/adminのみ閲覧可能（設計書⑦ RBAC）。 */
const ALLOWED_ROLES: SystemRole[] = ["ADMIN", "EDITOR"];

interface LifecycleTemplatesListPageProps {
  searchParams: Promise<{ cursor?: string }>;
}

/**
 * S22（管理: 工程マスタ管理、一覧）。全ステータス（DRAFT/PUBLISHED）を対象とし、
 * 新規作成（常にDRAFT）への導線をここに置く（S21のCreateCourseForm併置と異なり、
 * 工程一覧の入力欄が多いため専用ページ/admin/lifecycle-templates/newに分離する）。
 */
export default async function LifecycleTemplatesListPage({
  searchParams,
}: LifecycleTemplatesListPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(session.user.systemRole)) {
    notFound();
  }

  const { cursor } = await searchParams;
  const result = await listAdminLifecycleTemplates(session.accessToken, { cursor });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">工程マスタ管理</h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            機器種別・手続き種別ごとの標準工程（期間・費用・書類・根拠）を校閲・公開します。
          </p>
        </div>
        <Link
          href="/admin/lifecycle-templates/new"
          className="inline-flex min-h-[44px] items-center rounded-sm bg-accent px-4 text-[16px] font-medium text-white hover:opacity-90"
        >
          新規作成
        </Link>
      </div>

      <LifecycleTemplateTable items={result.items} />

      {result.nextCursor ? (
        <Link
          href={`/admin/lifecycle-templates?cursor=${encodeURIComponent(result.nextCursor)}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
