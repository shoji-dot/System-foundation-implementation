"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { createLifecycleTemplate } from "../api/admin-lifecycle-templates";

import { LifecycleTemplateForm } from "./LifecycleTemplateForm";

/** S22 新規作成ページのクライアント側ラッパー（セッション取得・作成後の遷移を担当）。 */
export function CreateLifecycleTemplateFormClient() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <LifecycleTemplateForm
      submitLabel="作成する"
      onSubmit={async (payload) => {
        if (!session?.accessToken) {
          throw new Error("セッションが切れています。再度ログインしてください。");
        }
        const created = await createLifecycleTemplate(session.accessToken, payload);
        router.push(`/admin/lifecycle-templates/${created.id}`);
        router.refresh();
      }}
    />
  );
}
