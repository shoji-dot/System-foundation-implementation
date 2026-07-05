"use client";

import type { JurisdictionCode, RegulationType, UpdateFrequency } from "@yakuji/shared";
import { JURISDICTION_CODES, REGULATION_TYPES } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { createSubscription } from "../api/subscriptions";

/** 法域コードの日本語表示名（MVPはJPのみ稼働、設計書⑨。他国はスキーマ・UIとして先行対応）。 */
const JURISDICTION_LABELS: Record<JurisdictionCode, string> = {
  JP: "日本",
  US: "米国",
  EU: "EU",
  UK: "英国",
  CA: "カナダ",
  AU: "オーストラリア",
  CN: "中国",
  KR: "韓国",
  TW: "台湾",
  SG: "シンガポール",
};

const REGULATION_TYPE_LABELS: Record<RegulationType, string> = {
  LAW: "法律",
  ORDINANCE: "政令・省令",
  NOTICE: "通知",
  GUIDANCE: "ガイダンス",
  STANDARD: "基準",
};

const FREQUENCY_LABELS: Record<UpdateFrequency, string> = {
  REALTIME: "即時",
  DAILY: "日次まとめ",
  WEEKLY: "週次まとめ",
};

const ALL_VALUE = "ALL";

/**
 * S18（通知設定、設計書⑫「購読国・タイプ・頻度」）の購読登録フォーム。
 * 既存購読の一覧・削除は設計書⑤にAPIが定義されていないため今回のスコープ外（新規登録のみ）。
 */
export function SubscriptionForm() {
  const { data: session } = useSession();
  const [jurisdiction, setJurisdiction] = useState<string>(ALL_VALUE);
  const [regulationType, setRegulationType] = useState<string>(ALL_VALUE);
  const [frequency, setFrequency] = useState<UpdateFrequency>("DAILY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await createSubscription(session.accessToken, {
        jurisdiction: jurisdiction === ALL_VALUE ? undefined : (jurisdiction as JurisdictionCode),
        regulationType:
          regulationType === ALL_VALUE ? undefined : (regulationType as RegulationType),
        frequency,
      });
      setSuccessMessage("購読を登録しました。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "購読設定の保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="jurisdiction" className="text-[14px] font-medium text-text">
          対象国
        </label>
        <select
          id="jurisdiction"
          value={jurisdiction}
          onChange={(event) => setJurisdiction(event.target.value)}
          className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value={ALL_VALUE}>全国</option>
          {JURISDICTION_CODES.map((code) => (
            <option key={code} value={code}>
              {JURISDICTION_LABELS[code]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="regulationType" className="text-[14px] font-medium text-text">
          対象種別
        </label>
        <select
          id="regulationType"
          value={regulationType}
          onChange={(event) => setRegulationType(event.target.value)}
          className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value={ALL_VALUE}>全タイプ</option>
          {REGULATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {REGULATION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" className="text-[14px] font-medium text-text">
          通知頻度
        </label>
        <select
          id="frequency"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as UpdateFrequency)}
          className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {(Object.keys(FREQUENCY_LABELS) as UpdateFrequency[]).map((value) => (
            <option key={value} value={value}>
              {FREQUENCY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "登録中…" : "購読を登録する"}
      </Button>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
      {successMessage ? (
        <p role="status" className="text-[14px] text-accent">
          {successMessage}
        </p>
      ) : null}
    </form>
  );
}
