import { REGULATION_STATUS_LABELS, REGULATION_TYPE_LABELS } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getRegulationDetail,
  listRegulationVersions,
  RegulationApiError,
} from "@/features/regulations/api/regulations";
import { RegulationDiffViewer } from "@/features/regulations/components/RegulationDiffViewer";
import { RegulationSections } from "@/features/regulations/components/RegulationSections";
import { RegulationVersionHistory } from "@/features/regulations/components/RegulationVersionHistory";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "法令詳細 | 医療機器薬事承認支援アプリ",
};

interface RegulationDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ versionsCursor?: string }>;
}

/**
 * 404(存在しない法規文書)の場合はnotFound()を呼ぶ。それ以外のエラーはそのまま再送出し、
 * Next.jsの最寄りのerror境界に処理を委ねる（IngestionReviewDetailPageと同じ方針）。
 */
async function loadDetail(accessToken: string, regulationId: string, versionsCursor?: string) {
  try {
    const [detail, versions] = await Promise.all([
      getRegulationDetail(accessToken, regulationId),
      listRegulationVersions(accessToken, regulationId, { cursor: versionsCursor }),
    ]);
    return { detail, versions };
  } catch (cause) {
    if (cause instanceof RegulationApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/**
 * S07（法令詳細、設計書⑫「条文表示・版切替・改正差分・関連文書・タグ」）。
 * 関連文書(regulation_relations)・タグはバックエンド未実装のため今回は対象外
 * （regulationDetailResponseSchemaのコメントと同じ方針、別コミットで追加予定）。
 * S06一覧（実装済み）から遷移するため戻り導線を持つ。S05検索からのリンクは別コミットで追加。
 */
export default async function RegulationDetailPage({
  params,
  searchParams,
}: RegulationDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const { versionsCursor } = await searchParams;
  const { detail, versions } = await loadDetail(session.accessToken, id, versionsCursor);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <Link href="/regulations" className="text-[14px] text-accent hover:underline">
        ← 法令一覧に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">{detail.title}</h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-text-secondary">
          <div className="flex gap-1">
            <dt className="font-medium">法域:</dt>
            <dd>{detail.jurisdiction.name}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">種別:</dt>
            <dd>{REGULATION_TYPE_LABELS[detail.type]}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">状態:</dt>
            <dd>{REGULATION_STATUS_LABELS[detail.status]}</dd>
          </div>
          {detail.docNumber ? (
            <div className="flex gap-1">
              <dt className="font-medium">文書番号:</dt>
              <dd>{detail.docNumber}</dd>
            </div>
          ) : null}
          {detail.effectiveDate ? (
            <div className="flex gap-1">
              <dt className="font-medium">施行日:</dt>
              <dd>{detail.effectiveDate}</dd>
            </div>
          ) : null}
        </dl>
        {detail.sourceUrl ? (
          <a
            href={detail.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[14px] text-accent hover:underline"
          >
            出典を見る
          </a>
        ) : null}
      </div>

      {detail.latestVersion ? (
        <section>
          <h2 className="mb-2 text-[18px] font-semibold text-text">
            条文（第{detail.latestVersion.versionNo}版）
          </h2>
          {detail.latestVersion.summary ? (
            <p className="mb-4 text-[14px] text-text-secondary">{detail.latestVersion.summary}</p>
          ) : null}
          <RegulationSections
            sections={detail.latestVersion.sections}
            fullText={detail.latestVersion.fullText}
          />
        </section>
      ) : (
        <p className="text-[14px] text-text-secondary">公開されている版がありません。</p>
      )}

      <section>
        <h2 className="mb-2 text-[18px] font-semibold text-text">改正履歴</h2>
        <RegulationVersionHistory
          regulationId={detail.id}
          items={versions.items}
          nextCursor={versions.nextCursor}
        />
      </section>

      <section>
        <h2 className="mb-2 text-[18px] font-semibold text-text">改正差分</h2>
        <RegulationDiffViewer regulationId={detail.id} versions={versions.items} />
      </section>
    </main>
  );
}
