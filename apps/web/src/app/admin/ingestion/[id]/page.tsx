import type { SystemRole } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getPendingReviewVersionDetail,
  PendingReviewApiError,
} from "@/features/workflow/api/pending-review";
import { DiffView } from "@/features/workflow/components/DiffView";
import { PublishVersionButton } from "@/features/workflow/components/PublishVersionButton";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "取込レビュー詳細 | 医療機器薬事承認支援アプリ",
};

/** 設計書⑫ S20は editor/admin のみ閲覧可能（設計書⑦ RBAC）。 */
const ALLOWED_ROLES: SystemRole[] = ["ADMIN", "EDITOR"];

interface IngestionReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 404(存在しない/既に公開済み)の場合はnotFound()を呼ぶ。それ以外のエラーはそのまま再送出し、
 * Next.jsの最寄りのerror境界に処理を委ねる。
 */
async function loadDetail(accessToken: string, versionId: string) {
  try {
    return await getPendingReviewVersionDetail(accessToken, versionId);
  } catch (cause) {
    if (cause instanceof PendingReviewApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/** 設計書⑫ S20（管理: 取込レビュー、詳細・公開）。editor/adminのみ閲覧可能（設計書⑦ RBAC）。 */
export default async function IngestionReviewDetailPage({
  params,
}: IngestionReviewDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(session.user.systemRole)) {
    notFound();
  }

  const { id } = await params;
  const detail = await loadDetail(session.accessToken, id);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <Link href="/admin/ingestion" className="text-[14px] text-accent hover:underline">
        ← 取込レビュー一覧に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">{detail.regulationTitle}</h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-text-secondary">
          <div className="flex gap-1">
            <dt className="font-medium">法域:</dt>
            <dd>{detail.jurisdiction.name}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">種別:</dt>
            <dd>{detail.type}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">版番号:</dt>
            <dd>{detail.versionNo}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">施行予定日:</dt>
            <dd>{detail.effectiveFrom}</dd>
          </div>
        </dl>
      </div>

      {detail.changeSummary ? (
        <p className="rounded-sm border border-border bg-surface p-4 text-[14px] text-text">
          {detail.changeSummary}
        </p>
      ) : null}

      <section>
        <h2 className="mb-2 text-[18px] font-semibold text-text">本文差分</h2>
        <DiffView oldText={detail.currentPublished?.fullText ?? null} newText={detail.fullText} />
      </section>

      <section>
        <h2 className="mb-2 text-[18px] font-semibold text-text">公開</h2>
        <PublishVersionButton versionId={detail.id} regulationTitle={detail.regulationTitle} />
      </section>
    </main>
  );
}
