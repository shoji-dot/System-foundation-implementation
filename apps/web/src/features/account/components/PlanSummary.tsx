import type { Plan } from "@yakuji/shared";
import { PLAN_LABELS } from "@yakuji/shared";
import Link from "next/link";

interface PlanSummaryProps {
  plan: Plan;
}

/**
 * S19「アカウント設定・プラン」表示（設計書⑦ エンタイトルメント層）。
 * 課金導線本体はS27「プラン/請求」（設計変更書① S27、Phase7 7-1 PR⑤）に集約し、
 * ここではプラン名表示とS27への導線リンクのみを持つ（設計変更書①「改修 S19: プラン表示→S27へ導線」）。
 */
export function PlanSummary({ plan }: PlanSummaryProps) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <p className="text-[13px] text-text-secondary">現在のプラン</p>
      <p className="text-[16px] font-semibold text-text">{PLAN_LABELS[plan]}</p>
      <Link
        href="/account/billing"
        className="mt-2 inline-block min-h-[44px] py-2 text-[14px] font-medium text-accent underline-offset-2 hover:underline"
      >
        プラン/請求を管理する
      </Link>
    </div>
  );
}
