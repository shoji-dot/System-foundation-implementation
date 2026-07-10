"use client";

import type { BillingInterval, PurchasablePlan } from "@yakuji/shared";
import { BILLING_INTERVALS } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { BillingApiError, createCheckoutSession } from "../api/billing";

const INTERVAL_LABELS: Record<BillingInterval, string> = {
  month: "月払い",
  year: "年払い",
};

const PURCHASABLE_PLAN_LABELS: Record<PurchasablePlan, string> = {
  PRO: "プロ",
  BUSINESS: "ビジネス",
};

const PURCHASABLE_PLAN_DESCRIPTIONS: Record<PurchasablePlan, string> = {
  PRO: "ロードマップ生成・工程別AI相談など、個人での申請業務を加速する機能一式。",
  BUSINESS:
    "組織ダッシュボード・メンバー管理・監査ログなど、組織での運用に必要な機能一式（席課金）。",
};

interface OrganizationOption {
  id: string;
  name: string;
}

interface PlanSelectorProps {
  /** BUSINESSプランを契約可能な組織（ORG_ADMIN権限を持つ組織のみ、設計変更書⑥「席課金」）。 */
  organizationOptions: OrganizationOption[];
}

/**
 * S27「プラン/請求」FREEユーザー向けアップグレードUI（設計変更書③ POST /billing/checkout）。
 * PROは個人課金、BUSINESSは組織課金（ORG_ADMIN限定、apps/api CreateCheckoutSessionUsecaseと同じ制約）。
 * ENTERPRISEは請求書払いのためCheckout対象外（ページ側で問い合わせ導線として別途表示）。
 */
export function PlanSelector({ organizationOptions }: PlanSelectorProps) {
  const { data: session } = useSession();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [organizationId, setOrganizationId] = useState<string>(organizationOptions[0]?.id ?? "");
  const [loadingPlan, setLoadingPlan] = useState<PurchasablePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (plan: PurchasablePlan) => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (plan === "BUSINESS" && !organizationId) {
      setError("組織管理者として参加している組織がありません。");
      return;
    }

    setError(null);
    setLoadingPlan(plan);

    try {
      const { url } = await createCheckoutSession(session.accessToken, {
        plan,
        interval: billingInterval,
        organizationId: plan === "BUSINESS" ? organizationId : undefined,
      });
      window.location.href = url;
    } catch (cause) {
      setError(
        cause instanceof BillingApiError
          ? cause.message
          : "アップグレード手続きの開始に失敗しました。",
      );
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {BILLING_INTERVALS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setBillingInterval(value)}
            aria-pressed={billingInterval === value}
            className={[
              "min-h-[44px] rounded-sm border px-4 text-[14px] font-medium",
              billingInterval === value
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-text",
            ].join(" ")}
          >
            {INTERVAL_LABELS[value]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg bg-surface p-4">
          <div>
            <p className="text-[16px] font-semibold text-text">{PURCHASABLE_PLAN_LABELS.PRO}</p>
            <p className="mt-1 text-[13px] text-text-secondary">
              {PURCHASABLE_PLAN_DESCRIPTIONS.PRO}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => handleUpgrade("PRO")}
            disabled={loadingPlan !== null}
            className="w-fit"
          >
            {loadingPlan === "PRO" ? "処理中…" : "プロにアップグレード"}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-surface p-4">
          <div>
            <p className="text-[16px] font-semibold text-text">
              {PURCHASABLE_PLAN_LABELS.BUSINESS}
            </p>
            <p className="mt-1 text-[13px] text-text-secondary">
              {PURCHASABLE_PLAN_DESCRIPTIONS.BUSINESS}
            </p>
          </div>

          {organizationOptions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="organizationId" className="text-[13px] font-medium text-text">
                契約する組織
              </label>
              <select
                id="organizationId"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
                className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {organizationOptions.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-[13px] text-text-secondary">
              組織管理者として参加している組織がありません。
            </p>
          )}

          <Button
            type="button"
            onClick={() => handleUpgrade("BUSINESS")}
            disabled={loadingPlan !== null || organizationOptions.length === 0}
            className="w-fit"
          >
            {loadingPlan === "BUSINESS" ? "処理中…" : "ビジネスにアップグレード"}
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
