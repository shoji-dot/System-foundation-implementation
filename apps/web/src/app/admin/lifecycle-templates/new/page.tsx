import type { SystemRole } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CreateLifecycleTemplateFormClient } from "@/features/lifecycle/components/CreateLifecycleTemplateFormClient";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "工程マスタ新規作成 | 医療機器薬事承認支援アプリ",
};

const ALLOWED_ROLES: SystemRole[] = ["ADMIN", "EDITOR"];

/** S22（管理: 工程マスタ新規作成）。作成直後は常にDRAFT（設計変更書③）。 */
export default async function NewLifecycleTemplatePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(session.user.systemRole)) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <Link href="/admin/lifecycle-templates" className="text-[14px] text-accent hover:underline">
        ← 工程マスタ一覧に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">工程マスタ新規作成</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          作成直後は下書き状態です。内容を確認のうえ、詳細画面から公開してください。
        </p>
      </div>

      <CreateLifecycleTemplateFormClient />
    </main>
  );
}
