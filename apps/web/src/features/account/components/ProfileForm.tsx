"use client";

import type { JurisdictionCode, Locale, Profession, UserResponse } from "@yakuji/shared";
import {
  JURISDICTION_CODES,
  JURISDICTION_LABELS,
  LOCALES,
  PROFESSIONS,
  PROFESSION_LABELS,
} from "@yakuji/shared";
import { Button, Input } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { AccountApiError, updateProfile } from "../api/account";

const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

interface ProfileFormProps {
  user: UserResponse;
}

/**
 * S19「アカウント設定・プロフィール」編集フォーム（設計書⑫、PATCH /api/v1/me/profile）。
 * OnboardingFormと同じUIパターン（職能=単一選択セレクト、関心国=複数選択チェックボックス）を踏襲し、
 * 既存値をプリフィルする点のみが異なる。
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [locale, setLocale] = useState<Locale>(user.locale as Locale);
  const [profession, setProfession] = useState<Profession>(user.profession ?? PROFESSIONS[0]);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionCode[]>(
    user.interestedJurisdictions,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleJurisdiction = (code: JurisdictionCode) => {
    setJurisdictions((current) =>
      current.includes(code) ? current.filter((value) => value !== code) : [...current, code],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (name.trim().length === 0) {
      setError("氏名を入力してください。");
      return;
    }
    if (jurisdictions.length === 0) {
      setError("関心のある国・地域を1つ以上選択してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updateProfile(session.accessToken, {
        name: name.trim(),
        locale,
        profession,
        interestedJurisdictions: jurisdictions,
      });
      // name・localeはNextAuthセッションにも保持しているため（設計書⑦のUser拡張）、更新後すぐに反映させる。
      await update({ name: updated.name, locale: updated.locale });
      setSuccessMessage("プロフィールを更新しました。");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof AccountApiError ? cause.message : "プロフィールの更新に失敗しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
      <Input
        label="氏名"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={100}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="locale" className="text-[14px] font-medium text-text">
          表示言語
        </label>
        <select
          id="locale"
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
          className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {LOCALES.map((value) => (
            <option key={value} value={value}>
              {LOCALE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

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
      {successMessage ? (
        <p role="status" className="text-[14px] text-accent">
          {successMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "保存中…" : "保存する"}
      </Button>
    </form>
  );
}
