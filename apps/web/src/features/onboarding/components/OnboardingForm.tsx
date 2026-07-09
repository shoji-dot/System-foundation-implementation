"use client";

import type { JurisdictionCode, Profession } from "@yakuji/shared";
import {
  JURISDICTION_CODES,
  JURISDICTION_LABELS,
  PROFESSIONS,
  PROFESSION_LABELS,
} from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { completeOnboarding, OnboardingApiError } from "../api/onboarding";

/**
 * S03（オンボーディング: 職能・関心国選択、設計書⑫）。
 * 職能は単一選択（SubscriptionFormの`<select>`パターンを踏襲）、関心国は複数選択必須（最低1か国）のため
 * チェックボックス群とする（HIG準拠、44pxタップ領域を確保できるnative selectのmultipleは避ける）。
 */
export function OnboardingForm() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [profession, setProfession] = useState<Profession>(PROFESSIONS[0]);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleJurisdiction = (code: JurisdictionCode) => {
    setJurisdictions((current) =>
      current.includes(code) ? current.filter((value) => value !== code) : [...current, code],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (jurisdictions.length === 0) {
      setError("関心のある国・地域を1つ以上選択してください。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const user = await completeOnboarding(session.accessToken, {
        profession,
        interestedJurisdictions: jurisdictions,
      });
      await update({ onboardingCompletedAt: user.onboardingCompletedAt });
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof OnboardingApiError ? cause.message : "登録に失敗しました。");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="profession" className="text-[14px] font-medium text-text">
          職能
        </label>
        <select
          id="profession"
          value={profession}
          onChange={(event) => setProfession(event.target.value as Profession)}
          className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {PROFESSIONS.map((value) => (
            <option key={value} value={value}>
              {PROFESSION_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[14px] font-medium text-text">
          関心のある国・地域(複数選択可)
        </legend>
        <div className="flex flex-col gap-1">
          {JURISDICTION_CODES.map((code) => (
            <label
              key={code}
              htmlFor={`jurisdiction-${code}`}
              className="flex min-h-[44px] items-center gap-3 text-[16px] text-text"
            >
              <input
                id={`jurisdiction-${code}`}
                type="checkbox"
                checked={jurisdictions.includes(code)}
                onChange={() => toggleJurisdiction(code)}
                className="h-5 w-5 rounded-sm border border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              {JURISDICTION_LABELS[code]}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "登録中…" : "はじめる"}
      </Button>
    </form>
  );
}
