import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser, listMyOrganizations } from "@/features/account/api/account";
import { OrganizationList } from "@/features/account/components/OrganizationList";
import { PlanSummary } from "@/features/account/components/PlanSummary";
import { ProfileForm } from "@/features/account/components/ProfileForm";
import { auth } from "@/shared/auth/auth";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export const metadata: Metadata = {
  title: "アカウント設定 | 医療機器薬事承認支援アプリ",
};

/**
 * S19（アカウント設定: プロフィール・組織・プラン・テーマ、設計書⑫）。
 * ログイン済みユーザーであれば誰でも利用可能（S18通知設定と同様、RBACの対象外）。
 * プロフィール編集・組織表示・プラン表示にはDBの最新値が必要なため、GET /me・GET /me/organizations を
 * Server Component側でリクエストごとに取得する（cache: "no-store"、S18の一覧取得と同方針）。
 */
export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [user, organizations] = await Promise.all([
    getCurrentUser(session.accessToken),
    listMyOrganizations(session.accessToken),
  ]);

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">アカウント設定</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          プロフィール・所属組織・プラン・テーマを確認・変更できます。
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-text">プロフィール</h2>
        <ProfileForm user={user} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-text">組織</h2>
        <OrganizationList items={organizations.items} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-text">プラン</h2>
        <PlanSummary plan={user.plan} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-text">テーマ</h2>
        <ThemeToggle />
      </section>
    </main>
  );
}
