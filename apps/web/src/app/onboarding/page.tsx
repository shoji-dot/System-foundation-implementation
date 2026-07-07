import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/features/onboarding/components/OnboardingForm";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "はじめに | 医療機器薬事承認支援アプリ",
};

/**
 * 設計書⑫ S03（オンボーディング: 職能・関心国選択）。設計書⑬の画面遷移 S01-S02-S03-S04 に基づき、
 * 未完了ユーザーは(middleware.tsの必須ゲートにより)ここへ強制的に誘導される。完了済みユーザーが
 * 再訪した場合はS04へ戻す。
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.onboardingCompletedAt) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-text">はじめに</h1>
        <p className="max-w-sm text-[14px] text-text-secondary">
          あなたの職能と関心のある国・地域を教えてください。表示内容のパーソナライズに使用します。
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}
