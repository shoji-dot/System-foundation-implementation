import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "医療機器薬事承認支援アプリ",
  description: "医療機器薬事承認支援アプリ（Phase 0: 基盤構築）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
