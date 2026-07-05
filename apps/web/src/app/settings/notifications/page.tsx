import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SubscriptionForm } from "@/features/notifications/components/SubscriptionForm";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "通知設定 | 医療機器薬事承認支援アプリ",
};

/**
 * S18（通知設定、設計書⑫「購読国・タイプ・頻度」）。ログイン済みユーザーであれば誰でも利用可能
 * （S20管理画面と異なりRBACの対象外、設計書⑦の一般ユーザー機能）。
 * 既存購読の一覧・解除は設計書⑤にAPIが定義されていないため今回のスコープ外（新規登録のみ）。
 */
export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">通知設定</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          国・種別・頻度を指定して、法規制の更新をアプリ内通知で受け取れます。
        </p>
      </div>

      <SubscriptionForm />
    </main>
  );
}
