import type { SystemRole } from "@yakuji/shared";
import {
  LIFECYCLE_DEVICE_CLASS_LABELS,
  LIFECYCLE_FRAMEWORK_LABELS,
  LIFECYCLE_PRODUCT_NOVELTY_LABELS,
  LIFECYCLE_TEMPLATE_STATUS_LABELS,
} from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  AdminLifecycleTemplatesApiError,
  getAdminLifecycleTemplateDetail,
} from "@/features/lifecycle/api/admin-lifecycle-templates";
import { DeleteLifecycleTemplateButton } from "@/features/lifecycle/components/DeleteLifecycleTemplateButton";
import { EditLifecycleTemplateFormClient } from "@/features/lifecycle/components/EditLifecycleTemplateFormClient";
import { LifecycleTemplateReadOnlyView } from "@/features/lifecycle/components/LifecycleTemplateReadOnlyView";
import { PublishLifecycleTemplateButton } from "@/features/lifecycle/components/PublishLifecycleTemplateButton";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "工程マスタ詳細 | 医療機器薬事承認支援アプリ",
};

const ALLOWED_ROLES: SystemRole[] = ["ADMIN", "EDITOR"];

interface LifecycleTemplateDetailPageProps {
  params: Promise<{ id: string }>;
}

/** 404(存在しない)の場合はnotFound()を呼ぶ。それ以外のエラーはそのまま再送出する（IngestionReview詳細と同方針）。 */
async function loadDetail(accessToken: string, templateId: string) {
  try {
    return await getAdminLifecycleTemplateDetail(accessToken, templateId);
  } catch (cause) {
    if (cause instanceof AdminLifecycleTemplatesApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/**
 * S22（管理: 工程マスタ管理、詳細・編集・公開）。DRAFTは編集フォーム+削除+公開、
 * PUBLISHEDは閲覧専用表示（設計変更書③「不変原則」、S20のDiffView+PublishVersionButtonと同方針）。
 */
export default async function LifecycleTemplateDetailPage({
  params,
}: LifecycleTemplateDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(session.user.systemRole)) {
    notFound();
  }

  const { id } = await params;
  const detail = await loadDetail(session.accessToken, id);
  const classLabel = detail.deviceClass ? LIFECYCLE_DEVICE_CLASS_LABELS[detail.deviceClass] : null;
  const noveltyLabel = detail.productNovelty
    ? LIFECYCLE_PRODUCT_NOVELTY_LABELS[detail.productNovelty]
    : null;
  const templateLabel = [
    detail.jurisdiction.name,
    LIFECYCLE_FRAMEWORK_LABELS[detail.framework],
    classLabel,
    noveltyLabel,
    detail.approvalRoute,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" / ");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <Link href="/admin/lifecycle-templates" className="text-[14px] text-accent hover:underline">
        ← 工程マスタ一覧に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">{templateLabel}</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          状態: {LIFECYCLE_TEMPLATE_STATUS_LABELS[detail.status]} ・ 版: {detail.version}
        </p>
      </div>

      {detail.status === "DRAFT" ? (
        <>
          <EditLifecycleTemplateFormClient detail={detail} />

          <section className="flex flex-col gap-4 border-t border-border pt-6">
            <h2 className="text-[18px] font-semibold text-text">公開</h2>
            <p className="text-[14px] text-text-secondary">
              公開すると版番号が確定し、以降の編集・削除はできません（概算レンジ・参考値である旨は利用者向け画面で別途表示されます）。
            </p>
            <PublishLifecycleTemplateButton templateId={detail.id} templateLabel={templateLabel} />
          </section>

          <section className="flex flex-col gap-4 border-t border-border pt-6">
            <h2 className="text-[18px] font-semibold text-text">削除</h2>
            <DeleteLifecycleTemplateButton
              templateId={detail.id}
              redirectTo="/admin/lifecycle-templates"
            />
          </section>
        </>
      ) : (
        <LifecycleTemplateReadOnlyView detail={detail} />
      )}
    </main>
  );
}
