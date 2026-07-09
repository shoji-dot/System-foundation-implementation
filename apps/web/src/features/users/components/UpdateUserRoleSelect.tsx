"use client";

import type { SystemRole } from "@yakuji/shared";
import { SYSTEM_ROLES } from "@yakuji/shared";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { updateUserRole } from "../api/admin-users";

const ROLE_LABEL: Record<SystemRole, string> = {
  ADMIN: "管理者",
  EDITOR: "編集者",
  USER: "一般ユーザー",
};

export interface UpdateUserRoleSelectProps {
  userId: string;
  systemRole: SystemRole;
}

/**
 * S21「ユーザー管理」ロール変更セレクト（ADMIN限定画面前提）。
 * クライアントコンポーネント: セッションのaccessTokenでNestJSを直接呼び出す
 * （PublishVersionButtonと同様の方針、設計書⑦ session.accessTokenは既にクライアントへ公開済み）。
 */
export function UpdateUserRoleSelect({ userId, systemRole }: UpdateUserRoleSelectProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = event.target.value as SystemRole;
    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateUserRole(session.accessToken, userId, nextRole);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ロールの変更に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="sr-only" htmlFor={`role-${userId}`}>
        ロール
      </label>
      <select
        id={`role-${userId}`}
        defaultValue={systemRole}
        disabled={isSaving}
        onChange={handleChange}
        className={[
          "min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "disabled:cursor-not-allowed disabled:opacity-40",
        ].join(" ")}
      >
        {SYSTEM_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABEL[role]}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
