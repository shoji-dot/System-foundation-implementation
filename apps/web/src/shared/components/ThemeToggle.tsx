"use client";

import { useEffect, useState } from "react";

import {
  THEME_COOKIE_NAME,
  THEME_PREFERENCES,
  isThemePreference,
  toHtmlDataTheme,
} from "../theme/theme";
import type { ThemePreference } from "../theme/theme";

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "端末の設定に合わせる",
  light: "ライト",
  dark: "ダーク",
};

/** Cookie保持期間（1年、設計書⑭「OS追従+手動切替」の選択を長期間保持するため）。 */
const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readThemeCookie(): ThemePreference {
  if (typeof document === "undefined") {
    return "system";
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE_NAME}=([^;]*)`));
  const rawValue = match?.[1];
  const value = rawValue !== undefined ? decodeURIComponent(rawValue) : undefined;
  return isThemePreference(value) ? value : "system";
}

function applyTheme(preference: ThemePreference): void {
  const htmlValue = toHtmlDataTheme(preference);
  if (htmlValue) {
    document.documentElement.setAttribute("data-theme", htmlValue);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  document.cookie = `${THEME_COOKIE_NAME}=${preference}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * S19「アカウント設定・テーマ」手動切替UI（設計書⑫⑭「ダークモード: OS追従+手動切替」）。
 * 初期値はlayout.tsx（Server Component）がCookieを読んで<html data-theme>に反映済みのため、
 * マウント後にここでCookieを読み直しても見た目のちらつきは発生しない（選択状態表示の同期のみ）。
 */
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    setPreference(readThemeCookie());
  }, []);

  function handleChange(next: ThemePreference): void {
    setPreference(next);
    applyTheme(next);
  }

  return (
    <div role="radiogroup" aria-label="テーマ" className="flex flex-wrap gap-2">
      {THEME_PREFERENCES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={preference === option}
          onClick={() => handleChange(option)}
          className={[
            "min-h-[44px] rounded-sm border px-4 text-[14px] font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            preference === option
              ? "border-accent bg-accent text-white"
              : "border-border bg-bg text-text",
          ].join(" ")}
          style={{ transitionDuration: "var(--motion-duration)" }}
        >
          {THEME_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
