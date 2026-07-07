"use client";

import type { SubscriptionResponse } from "@yakuji/shared";
import {
  JURISDICTION_LABELS,
  REGULATION_TYPE_LABELS,
  UPDATE_FREQUENCY_LABELS,
} from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { deleteSubscription } from "../api/subscriptions";

interface SubscriptionListProps {
  items: SubscriptionResponse[];
}

/** S18「既存購読の一覧・解除」。 */
export function SubscriptionList({ items }: SubscriptionListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      await deleteSubscription(session.accessToken, id);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "購読の解除に失敗しました。");
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">登録済みの購読はありません。</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[16px] font-semibold text-text">登録済みの購読</h2>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((subscription) => (
          <li
            key={subscription.id}
            className="flex items-center justify-between rounded-lg bg-surface p-4"
          >
            <div>
              <p className="text-[14px] font-medium text-text">
                {subscription.jurisdiction
                  ? JURISDICTION_LABELS[subscription.jurisdiction.code]
                  : "全国"}
                {" ・ "}
                {subscription.regulationType
                  ? REGULATION_TYPE_LABELS[subscription.regulationType]
                  : "全タイプ"}
              </p>
              <p className="text-[13px] text-text-secondary">
                {UPDATE_FREQUENCY_LABELS[subscription.frequency]}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={deletingId === subscription.id}
              onClick={() => handleDelete(subscription.id)}
            >
              {deletingId === subscription.id ? "解除中…" : "解除"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
