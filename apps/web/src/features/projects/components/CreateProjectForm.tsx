"use client";

import type { JurisdictionCode } from "@yakuji/shared";
import { JURISDICTION_CODES, JURISDICTION_LABELS } from "@yakuji/shared";
import { Button, Input } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { createProject } from "../api/projects";

/**
 * S15（プロジェクト一覧、設計書④ user_projects: name, device_class, target_jurisdictions準拠）の
 * プロジェクト作成フォーム。組織選択UIは未実装のため常に個人プロジェクトとして作成される。
 */
export function CreateProjectForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [deviceClass, setDeviceClass] = useState("");
  const [targetJurisdictions, setTargetJurisdictions] = useState<JurisdictionCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleJurisdiction = (code: JurisdictionCode) => {
    setTargetJurisdictions((current) =>
      current.includes(code) ? current.filter((value) => value !== code) : [...current, code],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("セッションが切れています。再度ログインしてください。");
      return;
    }
    if (name.trim().length === 0) {
      setError("プロジェクト名を入力してください。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProject(session.accessToken, {
        name: name.trim(),
        deviceClass: deviceClass.trim().length > 0 ? deviceClass.trim() : undefined,
        targetJurisdictions,
      });
      setName("");
      setDeviceClass("");
      setTargetJurisdictions([]);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "プロジェクトの作成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-surface p-4">
      <h2 className="text-[16px] font-semibold text-text">新規プロジェクト作成</h2>

      <Input
        label="プロジェクト名"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />

      <Input
        label="対象機器クラス（任意）"
        value={deviceClass}
        onChange={(event) => setDeviceClass(event.target.value)}
        placeholder="例: クラスII"
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[14px] font-medium text-text">対象国（任意）</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {JURISDICTION_CODES.map((code) => (
            <label
              key={code}
              className="flex min-h-[44px] items-center gap-2 text-[14px] text-text"
            >
              <input
                type="checkbox"
                checked={targetJurisdictions.includes(code)}
                onChange={() => toggleJurisdiction(code)}
                className="h-5 w-5 accent-accent"
              />
              {JURISDICTION_LABELS[code]}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "作成中…" : "プロジェクトを作成する"}
      </Button>
    </form>
  );
}
