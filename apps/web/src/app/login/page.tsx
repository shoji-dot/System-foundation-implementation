import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "ログイン | 医療機器薬事承認支援アプリ",
};

/** 設計書⑫ S02（ログイン）。 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold text-text">ログイン</h1>
      <LoginForm />
    </main>
  );
}
