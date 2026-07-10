"use client";

import type {
  CreateLifecycleTemplateRequest,
  JurisdictionCode,
  LifecycleDeviceCategory,
} from "@yakuji/shared";
import {
  JURISDICTION_CODES,
  JURISDICTION_LABELS,
  LIFECYCLE_DEVICE_CATEGORIES,
  LIFECYCLE_DEVICE_CATEGORY_LABELS,
} from "@yakuji/shared";
import { Button, Input } from "@yakuji/ui";
import { useState } from "react";
import type { FormEvent } from "react";

import { buildStepInput, createEmptyStep } from "../lib/step-form";
import type { StepFormValue } from "../lib/step-form";

import { LifecycleTemplateStepEditor } from "./LifecycleTemplateStepEditor";

export interface LifecycleTemplateFormInitialValues {
  jurisdiction: JurisdictionCode;
  deviceCategory: LifecycleDeviceCategory;
  procedureType: string;
  steps: StepFormValue[];
}

export interface LifecycleTemplateFormProps {
  initialValues?: LifecycleTemplateFormInitialValues;
  submitLabel: string;
  onSubmit: (payload: CreateLifecycleTemplateRequest) => Promise<void>;
}

/**
 * S22（工程マスタ管理）の作成・編集フォーム本体。CreateLifecycleTemplateRequestと
 * UpdateLifecycleTemplateRequestは同一形状（packages/shared/src/lifecycle.ts）のため、
 * 作成/更新の区別は呼び出し側のonSubmitに委譲する（このコンポーネントはpresentationalに徹する）。
 */
export function LifecycleTemplateForm({
  initialValues,
  submitLabel,
  onSubmit,
}: LifecycleTemplateFormProps) {
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>(
    initialValues?.jurisdiction ?? "JP",
  );
  const [deviceCategory, setDeviceCategory] = useState<LifecycleDeviceCategory>(
    initialValues?.deviceCategory ?? LIFECYCLE_DEVICE_CATEGORIES[0],
  );
  const [procedureType, setProcedureType] = useState(initialValues?.procedureType ?? "");
  const [steps, setSteps] = useState<StepFormValue[]>(initialValues?.steps ?? [createEmptyStep(0)]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (index: number, next: StepFormValue) => {
    setSteps((current) => current.map((step, i) => (i === index ? next : step)));
  };

  const removeStep = (index: number) => {
    setSteps((current) => current.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setSteps((current) => [...current, createEmptyStep(current.length)]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (procedureType.trim().length === 0) {
      setError("手続き種別を入力してください。");
      return;
    }
    if (steps.length === 0) {
      setError("工程を1件以上追加してください。");
      return;
    }

    const stepInputs: CreateLifecycleTemplateRequest["steps"] = [];
    for (const [i, step] of steps.entries()) {
      const result = buildStepInput(step, `工程${i + 1}`);
      if (result.error || !result.input) {
        setError(result.error ?? "工程の入力内容を確認してください。");
        return;
      }
      stepInputs.push(result.input);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        jurisdiction,
        deviceCategory,
        procedureType: procedureType.trim(),
        steps: stepInputs,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 rounded-lg bg-surface p-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="template-jurisdiction" className="text-[14px] font-medium text-text">
            法域
          </label>
          <select
            id="template-jurisdiction"
            value={jurisdiction}
            onChange={(event) => setJurisdiction(event.target.value as JurisdictionCode)}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {JURISDICTION_CODES.map((code) => (
              <option key={code} value={code}>
                {JURISDICTION_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="template-device-category" className="text-[14px] font-medium text-text">
            機器種別
          </label>
          <select
            id="template-device-category"
            value={deviceCategory}
            onChange={(event) => setDeviceCategory(event.target.value as LifecycleDeviceCategory)}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {LIFECYCLE_DEVICE_CATEGORIES.map((code) => (
              <option key={code} value={code}>
                {LIFECYCLE_DEVICE_CATEGORY_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="手続き種別"
          value={procedureType}
          onChange={(event) => setProcedureType(event.target.value)}
          placeholder="例: 届出・認証・承認"
          required
        />
      </div>

      <div className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <LifecycleTemplateStepEditor
            key={step.key}
            step={step}
            index={index}
            canRemove={steps.length > 1}
            onChange={(next) => updateStep(index, next)}
            onRemove={() => removeStep(index)}
          />
        ))}
        <Button type="button" variant="secondary" onClick={addStep} className="w-fit">
          工程を追加
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "保存中…" : submitLabel}
      </Button>
    </form>
  );
}
