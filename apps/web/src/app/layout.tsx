import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";

import { auth } from "@/shared/auth/auth";
import { GlobalNav } from "@/shared/components/GlobalNav";
import { THEME_COOKIE_NAME, isThemePreference, toHtmlDataTheme } from "@/shared/theme/theme";

import "./globals.css";

const APP_NAME = "薬事支援";
const APP_DEFAULT_TITLE = "医療機器薬事承認支援アプリ";
const APP_DESCRIPTION =
  "医療機器の薬事承認業務を、法規制の検索・学習・実務支援で一気通貫にサポートするアプリ。";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  // iOS ホーム画面追加対応（設計書②⑫ PWA: 「iOS/Androidはホーム画面追加で対応」）。
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0071e3",
};

/**
 * 設計書⑫「グローバルナビ...5項目固定」: ログイン済みセッションがある場合のみナビを表示する。
 * 設計書⑭「ダークモード: OS追従+手動切替（S19）」: テーマCookieをServer Component側で読み、
 * 初回描画から<html data-theme>に反映することでちらつき（FOUC）を防ぐ
 * （Cookie未設定＝"system"の場合はdata-theme属性を付けず、CSSのprefers-color-schemeに委ねる）。
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const cookieStore = await cookies();
  const themeCookieValue = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const themePreference = isThemePreference(themeCookieValue) ? themeCookieValue : "system";

  return (
    <html lang="ja" data-theme={toHtmlDataTheme(themePreference)}>
      <body className="min-h-screen antialiased">
        <SessionProvider>
          {session ? (
            <>
              <GlobalNav />
              <div className="pb-14 md:pb-0 md:pl-56">{children}</div>
            </>
          ) : (
            children
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
