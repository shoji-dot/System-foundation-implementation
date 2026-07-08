import type { Plan } from "@yakuji/shared";
import { PLAN_LABELS } from "@yakuji/shared";

interface PlanSummaryProps {
  plan: Plan;
}

/**
 * S19「アカウント設定・プラン」表示（設計書⑦ エンタイトルメント層）。
 * 課金導線(Stripe)は未実装のため表示のみで、アップグレードCTAは持たない（ユーザー承認済み）。
 */
export function PlanSummary({ plan }: PlanSummaryProps) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <p className="text-[13px] text-text-secondary">現在のプラン</p>
      <p className="text-[16px] font-semibold text-text">{PLAN_LABELS[plan]}</p>
    </div>
  );
}
