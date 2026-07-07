import { CLASSIFICATION_SCHEME_LABELS } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  ClassificationApiError,
  getClassificationDetail,
  getClassificationMappings,
} from "@/features/classifications/api/classifications";
import { ClassificationMappingList } from "@/features/classifications/components/ClassificationMappingList";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "分類詳細 | 医療機器薬事承認支援アプリ",
};

interface ClassificationDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 404(存在しない機器分類)の場合はnotFound()を呼ぶ。それ以外のエラーはそのまま再送出し、
 * Next.jsの最寄りのerror境界に処理を委ねる（IngestionReviewDetailPageと同じ方針）。
 */
async function loadDetail(accessToken: string, classificationId: string) {
  try {
    const [classification, mappings] = await Promise.all([
      getClassificationDetail(accessToken, classificationId),
      getClassificationMappings(accessToken, classificationId),
    ]);
    return { classification, mappings };
  } catch (cause) {
    if (cause instanceof ClassificationApiError && cause.status === 404) {
      notFound();
    }
    throw cause;
  }
}

/**
 * S09（分類詳細、設計書⑫「定義・該当法令・関連ガイダンス」）。
 * 該当法令・関連ガイダンスはtags/taggings（polymorphic: regulation/classification）実装時に
 * 対応する（バックエンド未実装のため今回は対象外、regulation_relations同様の判断）。
 * S08一覧（実装済み）から遷移するため戻り導線を持つ。
 */
export default async function ClassificationDetailPage({ params }: ClassificationDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const { classification, mappings } = await loadDetail(session.accessToken, id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <Link href="/classifications" className="text-[14px] text-accent hover:underline">
        ← JMDN検索に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text">{classification.name}</h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-text-secondary">
          <div className="flex gap-1">
            <dt className="font-medium">スキーム:</dt>
            <dd>{CLASSIFICATION_SCHEME_LABELS[classification.scheme]}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">コード:</dt>
            <dd>{classification.code}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">法域:</dt>
            <dd>{classification.jurisdiction.name}</dd>
          </div>
          {classification.class ? (
            <div className="flex gap-1">
              <dt className="font-medium">クラス:</dt>
              <dd>{classification.class}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {classification.definition ? (
        <section>
          <h2 className="mb-2 text-[18px] font-semibold text-text">定義</h2>
          <p className="rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap text-text">
            {classification.definition}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-[18px] font-semibold text-text">各国マッピング</h2>
        <ClassificationMappingList items={mappings.items} />
      </section>
    </main>
  );
}
