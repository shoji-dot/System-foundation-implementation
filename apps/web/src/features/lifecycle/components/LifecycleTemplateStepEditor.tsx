"use client";

import type { LifecyclePhaseCode } from "@yakuji/shared";
import { LIFECYCLE_PHASE_CODES, LIFECYCLE_PHASE_LABELS } from "@yakuji/shared";
import { Button, Input } from "@yakuji/ui";

import type { StepFormValue } from "../lib/step-form";

const TEXTAREA_CLASS_NAME = [
  "w-full rounded-sm border border-border bg-bg px-3 py-2 text-[16px] text-text",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
].join(" ");

interface LifecycleTemplateStepEditorProps {
  step: StepFormValue;
  index: number;
  canRemove: boolean;
  onChange: (next: StepFormValue) => void;
  onRemove: () => void;
}

/**
 * S22 工程マスタ管理の1工程分の入力欄（LifecycleTemplateFormから工程数だけ描画される）。
 * 情報密度より視認性を優先（設計書⑦UI）し、1工程=1カードで区切る。
 */
export function LifecycleTemplateStepEditor({
  step,
  index,
  canRemove,
  onChange,
  onRemove,
}: LifecycleTemplateStepEditorProps) {
  const update = <K extends keyof StepFormValue>(key: K, value: StepFormValue[K]) => {
    onChange({ ...step, [key]: value });
  };

  const updateSourceRef = (refIndex: number, field: "title" | "url", value: string) => {
    const sourceRefs = step.sourceRefs.map((ref, i) =>
      i === refIndex ? { ...ref, [field]: value } : ref,
    );
    update("sourceRefs", sourceRefs);
  };

  const addSourceRef = () => {
    update("sourceRefs", [...step.sourceRefs, { title: "", url: "" }]);
  };

  const removeSourceRef = (refIndex: number) => {
    update(
      "sourceRefs",
      step.sourceRefs.filter((_, i) => i !== refIndex),
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-text">工程 {index + 1}</h3>
        {canRemove ? (
          <Button type="button" variant="danger" onClick={onRemove}>
            この工程を削除
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`step-phase-${step.key}`} className="text-[14px] font-medium text-text">
            大工程
          </label>
          <select
            id={`step-phase-${step.key}`}
            value={step.phaseCode}
            onChange={(event) => update("phaseCode", event.target.value as LifecyclePhaseCode)}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {LIFECYCLE_PHASE_CODES.map((code) => (
              <option key={code} value={code}>
                {LIFECYCLE_PHASE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="工程名"
          value={step.name}
          onChange={(event) => update("name", event.target.value)}
          required
        />

        <Input
          label="順序"
          type="number"
          min={0}
          value={step.order}
          onChange={(event) => update("order", event.target.value)}
          required
        />

        <Input
          label="想定期間（最小・日）"
          type="number"
          min={0}
          value={step.durationMinDays}
          onChange={(event) => update("durationMinDays", event.target.value)}
          placeholder="未定なら空欄"
        />

        <Input
          label="想定期間（最大・日）"
          type="number"
          min={0}
          value={step.durationMaxDays}
          onChange={(event) => update("durationMaxDays", event.target.value)}
          placeholder="未定なら空欄"
        />

        <Input
          label="概算費用（最小・円）"
          type="number"
          min={0}
          value={step.costMinJpy}
          onChange={(event) => update("costMinJpy", event.target.value)}
          placeholder="未定なら空欄"
        />

        <Input
          label="概算費用（最大・円）"
          type="number"
          min={0}
          value={step.costMaxJpy}
          onChange={(event) => update("costMaxJpy", event.target.value)}
          placeholder="未定なら空欄"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`step-documents-${step.key}`} className="text-[14px] font-medium text-text">
          必要書類（1行1件）
        </label>
        <textarea
          id={`step-documents-${step.key}`}
          value={step.requiredDocuments}
          onChange={(event) => update("requiredDocuments", event.target.value)}
          rows={3}
          className={TEXTAREA_CLASS_NAME}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`step-tests-${step.key}`} className="text-[14px] font-medium text-text">
          必要試験（1行1件）
        </label>
        <textarea
          id={`step-tests-${step.key}`}
          value={step.requiredTests}
          onChange={(event) => update("requiredTests", event.target.value)}
          rows={3}
          className={TEXTAREA_CLASS_NAME}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`step-pmda-${step.key}`} className="text-[14px] font-medium text-text">
          PMDA資料URL（1行1件）
        </label>
        <textarea
          id={`step-pmda-${step.key}`}
          value={step.pmdaResourceUrls}
          onChange={(event) => update("pmdaResourceUrls", event.target.value)}
          rows={2}
          className={TEXTAREA_CLASS_NAME}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`step-regulation-ids-${step.key}`}
          className="text-[14px] font-medium text-text"
        >
          関連法規ID（1行1件、UUID）
        </label>
        <textarea
          id={`step-regulation-ids-${step.key}`}
          value={step.relatedRegulationIds}
          onChange={(event) => update("relatedRegulationIds", event.target.value)}
          rows={2}
          className={TEXTAREA_CLASS_NAME}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`step-notes-${step.key}`} className="text-[14px] font-medium text-text">
          備考（任意）
        </label>
        <textarea
          id={`step-notes-${step.key}`}
          value={step.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={2}
          className={TEXTAREA_CLASS_NAME}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-medium text-text">
          根拠（出典タイトル・URL、1件以上必須）
        </span>
        {step.sourceRefs.map((ref, refIndex) => (
          <div key={refIndex} className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="min-w-0 flex-1">
              <Input
                label="出典タイトル"
                value={ref.title}
                onChange={(event) => updateSourceRef(refIndex, "title", event.target.value)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Input
                label="出典URL"
                value={ref.url}
                onChange={(event) => updateSourceRef(refIndex, "url", event.target.value)}
              />
            </div>
            {step.sourceRefs.length > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => removeSourceRef(refIndex)}
                className="w-fit"
              >
                削除
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addSourceRef} className="w-fit">
          根拠を追加
        </Button>
      </div>
    </div>
  );
}
