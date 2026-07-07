import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { listUsers } from "@/features/users/api/admin-users";
import { UpdateUserPlanSelect } from "@/features/users/components/UpdateUserPlanSelect";
import { UpdateUserRoleSelect } from "@/features/users/components/UpdateUserRoleSelect";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "ユーザー管理 | 医療機器薬事承認支援アプリ",
};

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちユーザー管理画面。
 * コース・タグ管理（editor/admin）とは異なり、ロール/プラン変更は機微度が高いため
 * ADMIN限定とする（ユーザー承認済み、apps/api側 AdminUsersController と同方針）。
 */
interface AdminUsersPageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.systemRole !== "ADMIN") {
    notFound();
  }

  const { cursor } = await searchParams;
  const result = await listUsers(session.accessToken, { cursor });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-text">ユーザー管理</h1>
      <p className="text-[14px] text-text-secondary">
        ユーザーの一覧確認、ロール・プランの変更ができます。
      </p>

      {result.items.length === 0 ? (
        <p className="text-[16px] text-text-secondary">ユーザーがまだ登録されていません。</p>
      ) : (
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th scope="col" className="py-2 pr-4 font-medium">
                名前
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                メールアドレス
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                ロール
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                プラン
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                登録日
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-3 pr-4 text-text">{item.name}</td>
                <td className="py-3 pr-4 text-text">{item.email}</td>
                <td className="py-3 pr-4">
                  <UpdateUserRoleSelect userId={item.id} systemRole={item.systemRole} />
                </td>
                <td className="py-3 pr-4">
                  <UpdateUserPlanSelect userId={item.id} plan={item.plan} />
                </td>
                <td className="py-3 pr-4 text-text">{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {result.nextCursor ? (
        <Link
          href={`/admin/users?cursor=${encodeURIComponent(result.nextCursor)}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
