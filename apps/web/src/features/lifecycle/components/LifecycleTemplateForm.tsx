"use client";

import type {
  CreateLifecycleTemplateRequest,
  JurisdictionCode,
  LifecycleDeviceClass,
  LifecycleFramework,
  LifecycleProductNovelty,
} from "@yakuji/shared";
import {
  JURISDICTION_CODES,
  JURISDICTION_LABELS,
  LIFECYCLE_DEVICE_CLASS_LABELS,
  LIFECYCLE_DEVICE_CLASSES,
  LIFECYCLE_FRAMEWORK_LABELS,
  LIFECYCLE_FRAMEWORKS,
  LIFECYCLE_PRODUCT_NOVELTIES,
  LIFECYCLE_PRODUCT_NOVELTY_LABELS,
} from "@yakuji/shared";
import { Button, Input } from "@yakuji/ui";
import { useState } from "react";
import type { FormEvent } from "react";

import { arrayToLines, buildStepInput, createEmptyStep, linesToArray } from "../lib/step-form";
import type { StepFormValue } from "../lib/step-form";

import { LifecycleTemplateStepEditor } from "./LifecycleTemplateStepEditor";

/** select要素の「未選択（該当なし）」を表す値。deviceClass/productNoveltyはnullable項目のため。 */
const NONE_OPTION_VALUE = "";

export interface LifecycleTemplateFormInitialValues {
  jurisdiction: JurisdictionCode;
  framework: LifecycleFramework;
  deviceClass: LifecycleDeviceClass | null;
  productNovelty: LifecycleProductNovelty | null;
  approvalRoute: string;
  characteristics: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  steps: StepFormValue[];
}

export interface LifecycleTemplateFormProps {
  initialValues?: LifecycleTemplateFormInitialValues;
  submitLabel: string;
  onSubmit: (payload: CreateLifecycleTemplateRequest) => Promise<void>;
}

function todayAsDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * S22（工程マスタ管理）の作成・編集フォーム本体。CreateLifecycleTemplateRequestと
 * UpdateLifecycleTemplateRequestは同一形状（packages/shared/src/lifecycle.ts）のため、
 * 作成/更新の区別は呼び出し側のonSubmitに委譲する（このコンポーネントはpresentationalに徹する）。
 * Phase7 7-2再設計（2026-07-10ユーザー承認）: deviceCategory単一軸をframework/deviceClass/
 * productNoveltyに分離し、SaMD/能動植込み等はcharacteristics（タグ、1行1件テキスト入力）で表現する。
 */
export function LifecycleTemplateForm({
  initialValues,
  submitLabel,
  onSubmit,
}: LifecycleTemplateFormProps) {
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>(
    initialValues?.jurisdiction ?? "JP",
  );
  const [framework, setFramework] = useState<LifecycleFramework>(
    initialValues?.framework ?? LIFECYCLE_FRAMEWORKS[0],
  );
  const [deviceClass, setDeviceClass] = useState<LifecycleDeviceClass | "">(
    initialValues?.deviceClass ?? NONE_OPTION_VALUE,
  );
  const [productNovelty, setProductNovelty] = useState<LifecycleProductNovelty | "">(
    initialValues?.productNovelty ?? NONE_OPTION_VALUE,
  );
  const [approvalRoute, setApprovalRoute] = useState(initialValues?.approvalRoute ?? "");
  const [characteristics, setCharacteristics] = useState(
    arrayToLines(initialValues?.characteristics ?? []),
  );
  const [effectiveFrom, setEffectiveFrom] = useState(
    initialValues?.effectiveFrom ?? todayAsDateInputValue(),
  );
  const [effectiveTo, setEffectiveTo] = useState(initialValues?.effectiveTo ?? "");
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

    if (approvalRoute.trim().length === 0) {
      setError("手続き区分を入力してください。");
      return;
    }
    if (effectiveFrom.trim().length === 0) {
      setError("データ有効開始日を入力してください。");
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
        framework,
        deviceClass: deviceClass === NONE_OPTION_VALUE ? null : deviceClass,
        productNovelty: productNovelty === NONE_OPTION_VALUE ? null : productNovelty,
        approvalRoute: approvalRoute.trim(),
        characteristics: linesToArray(characteristics),
        effectiveFrom: effectiveFrom.trim(),
        effectiveTo: effectiveTo.trim().length > 0 ? effectiveTo.trim() : null,
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
          <label htmlFor="template-framework" className="text-[14px] font-medium text-text">
            法体系区分
          </label>
          <select
            id="template-framework"
            value={framework}
            onChange={(event) => setFramework(event.target.value as LifecycleFramework)}
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {LIFECYCLE_FRAMEWORKS.map((code) => (
              <option key={code} value={code}>
                {LIFECYCLE_FRAMEWORK_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="template-device-class" className="text-[14px] font-medium text-text">
            クラス分類（該当する場合のみ）
          </label>
          <select
            id="template-device-class"
            value={deviceClass}
            onChange={(event) =>
              setDeviceClass(event.target.value as LifecycleDeviceClass | typeof NONE_OPTION_VALUE)
            }
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value={NONE_OPTION_VALUE}>該当なし</option>
            {LIFECYCLE_DEVICE_CLASSES.map((code) => (
              <option key={code} value={code}>
                {LIFECYCLE_DEVICE_CLASS_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="template-product-novelty" className="text-[14px] font-medium text-text">
            新規性区分（該当する場合のみ）
          </label>
          <select
            id="template-product-novelty"
            value={productNovelty}
            onChange={(event) =>
              setProductNovelty(
                event.target.value as LifecycleProductNovelty | typeof NONE_OPTION_VALUE,
              )
            }
            className="min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value={NONE_OPTION_VALUE}>該当なし</option>
            {LIFECYCLE_PRODUCT_NOVELTIES.map((code) => (
              <option key={code} value={code}>
                {LIFECYCLE_PRODUCT_NOVELTY_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="手続き区分"
          value={approvalRoute}
          onChange={(event) => setApprovalRoute(event.target.value)}
          placeholder="例: 届出・認証・承認"
          required
        />

        <Input
          label="データ有効開始日"
          type="date"
          value={effectiveFrom}
          onChange={(event) => setEffectiveFrom(event.target.value)}
          required
        />

        <Input
          label="データ有効終了日（任意、改定時に設定）"
          type="date"
          value={effectiveTo}
          onChange={(event) => setEffectiveTo(event.target.value)}
        />

        <div className="flex flex-col gap-1 md:col-span-3">
          <label htmlFor="template-characteristics" className="text-[14px] font-medium text-text">
            特性タグ（1行1件、例: SaMD / ActiveImplantable / Sterile）
          </label>
          <textarea
            id="template-characteristics"
            value={characteristics}
            onChange={(event) => setCharacteristics(event.target.value)}
            rows={3}
            className="rounded-sm border border-border bg-bg px-3 py-2 text-[16px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
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
