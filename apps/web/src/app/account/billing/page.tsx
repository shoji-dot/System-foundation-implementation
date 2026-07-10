import { PLAN_LABELS } from "@yakuji/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser, listMyOrganizations } from "@/features/account/api/account";
import { BillingPortalButton } from "@/features/billing/components/BillingPortalButton";
import { PlanSelector } from "@/features/billing/components/PlanSelector";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "プラン/請求 | 医療機器薬事承認支援アプリ",
};

interface BillingPageProps {
  searchParams: Promise<{ checkout?: string }>;
}

/**
 * S27「プラン/請求」（設計変更書① S27「Stripe Customer Portal 連携（プラン変更・請求書・支払方法）」、全員利用可）。
 * FREEユーザーはPlanSelectorでアップグレード（Checkout）、既契約者（PRO/BUSINESS）はBillingPortalButtonで
 * Stripe Customer Portalへ遷移し、プラン変更・請求書・支払方法の変更はPortal側のUIに委譲する
 * （設計変更書③、自前でプラン変更UIを作らない方針）。ENTERPRISEは請求書払いのため両方とも対象外
 * （COMPLIMENTARY付与によるENTERPRISEも含む、stripeCustomerIdが無いためPortalは開けない）。
 * successUrl/cancelUrl/returnUrl（apps/api の各usecase）は本ページの絶対パス `/account/billing` を
 * 前提にしているため、パスを変更する場合はそちらも合わせて変更すること。
 */
export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { checkout } = await searchParams;

  const [user, organizations] = await Promise.all([
    getCurrentUser(session.accessToken),
    listMyOrganizations(session.accessToken),
  ]);

  const organizationOptions = organizations.items
    .filter((membership) => membership.role === "ORG_ADMIN")
    .map((membership) => ({ id: membership.organizationId, name: membership.organizationName }));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">プラン/請求</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          契約プランの確認・変更、請求書・支払方法の管理ができます。
        </p>
      </div>

      {checkout === "success" ? (
        <p role="status" className="rounded-lg bg-surface p-4 text-[14px] text-accent">
          お手続きが完了しました。反映まで数分かかる場合があります。
        </p>
      ) : null}
      {checkout === "canceled" ? (
        <p role="status" className="rounded-lg bg-surface p-4 text-[14px] text-text-secondary">
          お手続きをキャンセルしました。
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-text">現在のプラン</h2>
        <div className="rounded-lg bg-surface p-4">
          <p className="text-[16px] font-semibold text-text">{PLAN_LABELS[user.plan]}</p>
        </div>
      </section>

      {user.plan === "FREE" ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-text">プランを選択</h2>
          <PlanSelector organizationOptions={organizationOptions} />
        </section>
      ) : null}

      {user.plan === "PRO" || user.plan === "BUSINESS" ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-text">請求管理</h2>
          <p className="text-[13px] text-text-secondary">
            プラン変更・請求書の確認・支払方法の変更はStripeの管理画面で行います。
          </p>
          {/* 既知の制約（技術的負債）: 複数組織のORG_ADMINを兼務する場合、最初の組織のみを対象とする
              （組織選択UIは未実装）。実務上は稀なケースとして許容する（YAGNI）。 */}
          <BillingPortalButton
            organizationId={user.plan === "BUSINESS" ? organizationOptions[0]?.id : undefined}
          />
        </section>
      ) : null}

      {user.plan === "ENTERPRISE" ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-text">エンタープライズプラン</h2>
          <p className="text-[13px] text-text-secondary">
            エンタープライズプランは請求書払いです。ご不明点は営業担当までお問い合わせください。
          </p>
        </section>
      ) : null}
    </main>
  );
}
