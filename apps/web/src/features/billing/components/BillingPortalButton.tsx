"use client";

import { Button } from "@yakuji/ui";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { BillingApiError, createPortalSession } from "../api/billing";

interface BillingPortalButtonProps {
  /** BUSINESSプランの組織の請求を開く場合のみ指定（設計変更書③、checkoutと同じ方針）。 */
  organizationId?: string;
}

/**
 * S27「プラン/請求」既契約者向け（設計変更書③ POST /billing/portal）。
 * プラン変更・請求書・支払方法の変更はStripe Customer Portal側のUIに委譲する
 * （設計変更書① S27「Stripe Customer Portal 連携」）。stripeCustomerIdが存在しない
 * （COMPLIMENTARY付与のみ、または未契約）場合は404が返るため、その場合はエラーメッセージを表示する。
 */
export function BillingPortalButton({ organizationId }: BillingPortalButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { url } = await createPortalSession(session.accessToken, { organizationId });
      window.location.href = url;
    } catch (cause) {
      setError(
        cause instanceof BillingApiError ? cause.message : "請求管理画面を開けませんでした。",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleOpenPortal}
        disabled={isLoading}
        className="w-fit"
      >
        {isLoading ? "処理中…" : "請求を管理する"}
      </Button>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
