import type { Metadata } from "next";

import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = {
  title: "新規登録 | 医療機器薬事承認支援アプリ",
};

/** 設計書⑫ S02（登録）。 */
export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold text-text">新規登録</h1>
      <SignupForm />
    </main>
  );
}
