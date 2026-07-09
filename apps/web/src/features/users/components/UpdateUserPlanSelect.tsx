"use client";

import type { Plan } from "@yakuji/shared";
import { PLANS } from "@yakuji/shared";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { updateUserPlan } from "../api/admin-users";

const PLAN_LABEL: Record<Plan, string> = {
  FREE: "無料",
  PRO: "プロ",
  BUSINESS: "ビジネス",
  ENTERPRISE: "エンタープライズ",
};

export interface UpdateUserPlanSelectProps {
  userId: string;
  plan: Plan;
}

/**
 * S21「ユーザー管理」プラン変更セレクト（ADMIN限定画面前提）。
 * UpdateUserRoleSelectと同様の方針（クライアントコンポーネント、accessTokenで直接呼び出し）。
 */
export function UpdateUserPlanSelect({ userId, plan }: UpdateUserPlanSelectProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPlan = event.target.value as Plan;
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateUserPlan(session.accessToken, userId, nextPlan);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "プランの変更に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="sr-only" htmlFor={`plan-${userId}`}>
        プラン
      </label>
      <select
        id={`plan-${userId}`}
        defaultValue={plan}
        disabled={isSaving}
        onChange={handleChange}
        className={[
          "min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "disabled:cursor-not-allowed disabled:opacity-40",
        ].join(" ")}
      >
        {PLANS.map((planOption) => (
          <option key={planOption} value={planOption}>
            {PLAN_LABEL[planOption]}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
