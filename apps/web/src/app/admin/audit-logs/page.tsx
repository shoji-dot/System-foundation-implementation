import type { SystemRole } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { listAuditLogs } from "@/features/audit/api/audit-logs";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "監査ログ | 医療機器薬事承認支援アプリ",
};

/**
 * 設計書④ audit_logsの閲覧画面。設計書⑫の画面一覧には明記が無いが、S20（管理: 取込レビュー）
 * と同様 editor/admin のみ閲覧可能とする（設計書⑦ RBAC）。ユーザー承認済み（2026-07-07）。
 */
const ALLOWED_ROLES: SystemRole[] = ["ADMIN", "EDITOR"];

interface AuditLogListPageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function AuditLogListPage({ searchParams }: AuditLogListPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(session.user.systemRole)) {
    notFound();
  }

  const { cursor } = await searchParams;
  const result = await listAuditLogs(session.accessToken, { cursor });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-text">監査ログ</h1>
      <p className="text-[14px] text-text-secondary">
        管理操作の記録一覧です（新しい記録から順に表示）。
      </p>

      {result.items.length === 0 ? (
        <p className="text-[16px] text-text-secondary">監査ログはまだありません。</p>
      ) : (
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th scope="col" className="py-2 pr-4 font-medium">
                日時
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                実行者
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                操作
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                対象
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-3 pr-4 text-text">{item.createdAt}</td>
                <td className="py-3 pr-4 text-text">{item.actorId ?? "システム"}</td>
                <td className="py-3 pr-4 text-text">{item.action}</td>
                <td className="py-3 pr-4 text-text">{item.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {result.nextCursor ? (
        <Link
          href={`/admin/audit-logs?cursor=${encodeURIComponent(result.nextCursor)}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
