import type { SystemRole } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { listPendingReviewVersions } from "@/features/workflow/api/pending-review";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "取込レビュー | 医療機器薬事承認支援アプリ",
};

/** 設計書⑫ S20は editor/admin のみ閲覧可能（設計書⑦ RBAC）。 */
const ALLOWED_ROLES: SystemRole[] = ["ADMIN", "EDITOR"];

interface IngestionReviewListPageProps {
  searchParams: Promise<{ cursor?: string }>;
}

/** 設計書⑫ S20（管理: 取込レビュー、一覧）。editor/adminのみ閲覧可能（設計書⑦ RBAC）。 */
export default async function IngestionReviewListPage({
  searchParams,
}: IngestionReviewListPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(session.user.systemRole)) {
    notFound();
  }

  const { cursor } = await searchParams;
  const result = await listPendingReviewVersions(session.accessToken, { cursor });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-text">取込レビュー</h1>
      <p className="text-[14px] text-text-secondary">
        取込パイプラインが検知した改正・新規法規の校閲待ち一覧です。内容を確認のうえ公開してください。
      </p>

      {result.items.length === 0 ? (
        <p className="text-[16px] text-text-secondary">校閲待ちの版はありません。</p>
      ) : (
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th scope="col" className="py-2 pr-4 font-medium">
                法規名
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                法域
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                種別
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                状態
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                施行予定日
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/ingestion/${item.id}`}
                    className="font-medium text-accent underline-offset-2 hover:underline"
                  >
                    {item.regulationTitle}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-text">{item.jurisdiction.name}</td>
                <td className="py-3 pr-4 text-text">{item.type}</td>
                <td className="py-3 pr-4 text-text">
                  {item.status === "DRAFT" ? "未校閲" : "校閲中"}
                </td>
                <td className="py-3 pr-4 text-text">{item.effectiveFrom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {result.nextCursor ? (
        <Link
          href={`/admin/ingestion?cursor=${encodeURIComponent(result.nextCursor)}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </main>
  );
}
