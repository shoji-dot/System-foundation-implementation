"use client";

import type { LifecycleTemplateDetailResponse } from "@yakuji/shared";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { updateLifecycleTemplate } from "../api/admin-lifecycle-templates";
import { stepFromResponse } from "../lib/step-form";

import { LifecycleTemplateForm } from "./LifecycleTemplateForm";

interface EditLifecycleTemplateFormClientProps {
  detail: LifecycleTemplateDetailResponse;
}

/** S22 編集ページのクライアント側ラッパー（DRAFTのみ表示される画面前提、更新後は再取得のみ）。 */
export function EditLifecycleTemplateFormClient({ detail }: EditLifecycleTemplateFormClientProps) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <LifecycleTemplateForm
      submitLabel="保存する"
      initialValues={{
        jurisdiction: detail.jurisdiction.code,
        deviceCategory: detail.deviceCategory,
        procedureType: detail.procedureType,
        steps: [...detail.steps]
          .sort((a, b) => a.order - b.order)
          .map((step) => stepFromResponse(step)),
      }}
      onSubmit={async (payload) => {
        if (!session?.accessToken) {
          throw new Error("セッションが切れています。再度ログインしてください。");
        }
        await updateLifecycleTemplate(session.accessToken, detail.id, payload);
        router.refresh();
      }}
    />
  );
}
