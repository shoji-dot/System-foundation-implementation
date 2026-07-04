import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
