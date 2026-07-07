"use client";

import type { ClassificationCandidateResponse } from "@yakuji/shared";
import { Button } from "@yakuji/ui";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { ClassifyApiError, classifyDevice } from "../api/classify";

/**
 * S14「分類支援」タブ（設計書⑤⑥ POST /api/v1/ai/classify）。
 * chatと異なりストリーミング不要の1往復JSON応答のため、状態はシンプルなidle/loading/result/errorのみ。
 */
export function ClassifyPanel() {
  const { data: session } = useSession();
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<ClassificationCandidateResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = description.trim();
    if (!trimmed || !session?.accessToken || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await classifyDevice(session.accessToken, { description: trimmed });
      setCandidates(response.candidates);
      setSearched(true);
    } catch (cause) {
      setError(cause instanceof ClassifyApiError ? cause.message : "分類候補の取得に失敗しました。");
      setCandidates(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="classify-description" className="text-[13px] font-medium text-text-secondary">
          医療機器の概要を入力してください
        </label>
        <textarea
          id="classify-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={isLoading}
          rows={4}
          placeholder="例: 血圧を非侵襲的に測定するオシロメトリック方式の家庭用血圧計"
          className={[
            "min-h-[44px] rounded-sm border border-border bg-bg px-3 py-2 text-[16px] text-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          ].join(" ")}
        />
        <Button
          type="submit"
          disabled={isLoading || !description.trim()}
          className="self-start"
        >
          {isLoading ? "検索中…" : "候補を検索"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {searched && !error && (candidates?.length ?? 0) === 0 ? (
          <p className="text-[14px] text-text-secondary">
            該当する分類候補が見つかりませんでした。機器の概要をより具体的に入力してください。
          </p>
        ) : null}

        {candidates?.map((candidate) => (
          <div
            key={candidate.classificationId}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-medium text-text">{candidate.name}</p>
                <p className="text-[13px] text-text-secondary">
                  {candidate.scheme} {candidate.code}
                  {candidate.class ? ` ・ クラス${candidate.class}` : ""}
                  {" ・ "}
                  {candidate.jurisdiction.name}
                </p>
              </div>
              <span className="whitespace-nowrap text-[13px] font-medium text-accent">
                確信度 {Math.round(candidate.confidence * 100)}%
              </span>
            </div>
            {candidate.definition ? (
              <p className="mt-2 text-[13px] text-text-secondary">{candidate.definition}</p>
            ) : null}
            <p className="mt-2 text-[13px] text-text">{candidate.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
