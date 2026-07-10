import type {
  AdminLifecycleTemplateStepInput,
  LifecyclePhaseCode,
  LifecycleTemplateStepResponse,
} from "@yakuji/shared";
import { LIFECYCLE_PHASE_CODES } from "@yakuji/shared";

/**
 * S22（工程マスタ管理）作成・編集フォームの1工程分の入力状態。
 * requiredDocuments等の配列フィールドは1行1件のtextarea入力とし（設計書に専用UIの指定はなく、
 * regulation_versionsのfullText同様「校閲者が整形済みテキストを貼り付ける」運用を想定したYAGNI判断）、
 * sourceRefs（根拠、設計変更書④「根拠必須」）のみtitle/urlの組として個別入力する。
 */
export interface StepFormSourceRef {
  title: string;
  url: string;
}

export interface StepFormValue {
  /** React key安定化のためのクライアント側一時ID（APIへは送信しない）。 */
  key: string;
  phaseCode: LifecyclePhaseCode;
  name: string;
  order: string;
  durationMinDays: string;
  durationMaxDays: string;
  costMinJpy: string;
  costMaxJpy: string;
  requiredDocuments: string;
  requiredTests: string;
  relatedRegulationIds: string;
  pmdaResourceUrls: string;
  notes: string;
  sourceRefs: StepFormSourceRef[];
}

function generateKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `step-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 新規工程の初期値（order省略時は末尾追加を想定した呼び出し側でindexを渡す）。 */
export function createEmptyStep(order: number): StepFormValue {
  return {
    key: generateKey(),
    phaseCode: LIFECYCLE_PHASE_CODES[0],
    name: "",
    order: String(order),
    durationMinDays: "",
    durationMaxDays: "",
    costMinJpy: "",
    costMaxJpy: "",
    requiredDocuments: "",
    requiredTests: "",
    relatedRegulationIds: "",
    pmdaResourceUrls: "",
    notes: "",
    sourceRefs: [{ title: "", url: "" }],
  };
}

/**
 * 配列⇔改行区切りテキストの相互変換（Phase7 7-2再設計でLifecycleTemplateForm.tsxの
 * characteristics入力からも再利用するためexportする）。
 */
export function arrayToLines(items: readonly string[] | null): string {
  return (items ?? []).join("\n");
}

export function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** GET詳細応答の1工程（管理APIはマスクなし）をフォーム初期値に変換する。 */
export function stepFromResponse(step: LifecycleTemplateStepResponse): StepFormValue {
  return {
    key: step.id,
    phaseCode: step.phase.code,
    name: step.name,
    order: String(step.order),
    durationMinDays: step.durationMinDays === null ? "" : String(step.durationMinDays),
    durationMaxDays: step.durationMaxDays === null ? "" : String(step.durationMaxDays),
    costMinJpy: step.costMinJpy === null ? "" : String(step.costMinJpy),
    costMaxJpy: step.costMaxJpy === null ? "" : String(step.costMaxJpy),
    requiredDocuments: arrayToLines(step.requiredDocuments),
    requiredTests: arrayToLines(step.requiredTests),
    relatedRegulationIds: arrayToLines(step.relatedRegulationIds),
    pmdaResourceUrls: arrayToLines(step.pmdaResourceUrls),
    notes: step.notes ?? "",
    sourceRefs:
      step.sourceRefs && step.sourceRefs.length > 0
        ? step.sourceRefs.map((ref) => ({ title: ref.title, url: ref.url }))
        : [{ title: "", url: "" }],
  };
}

export interface StepValidationResult {
  input?: AdminLifecycleTemplateStepInput;
  error?: string;
}

/** 1工程分のフォーム状態をAPIリクエスト形状へ変換・検証する（数値欄・根拠必須のバリデーション込み）。 */
export function buildStepInput(step: StepFormValue, stepLabel: string): StepValidationResult {
  if (step.name.trim().length === 0) {
    return { error: `${stepLabel}: 工程名を入力してください。` };
  }

  const order = Number(step.order);
  if (!Number.isInteger(order) || order < 0) {
    return { error: `${stepLabel}: 順序は0以上の整数で入力してください。` };
  }

  const parseNullableInt = (value: string): number | null | undefined => {
    if (value.trim().length === 0) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return undefined;
    }
    return parsed;
  };

  const durationMinDays = parseNullableInt(step.durationMinDays);
  if (durationMinDays === undefined) {
    return { error: `${stepLabel}: 想定期間（最小）は0以上の整数で入力してください。` };
  }
  const durationMaxDays = parseNullableInt(step.durationMaxDays);
  if (durationMaxDays === undefined) {
    return { error: `${stepLabel}: 想定期間（最大）は0以上の整数で入力してください。` };
  }
  const costMinJpy = parseNullableInt(step.costMinJpy);
  if (costMinJpy === undefined) {
    return { error: `${stepLabel}: 概算費用（最小）は0以上の整数で入力してください。` };
  }
  const costMaxJpy = parseNullableInt(step.costMaxJpy);
  if (costMaxJpy === undefined) {
    return { error: `${stepLabel}: 概算費用（最大）は0以上の整数で入力してください。` };
  }

  const sourceRefs = step.sourceRefs
    .map((ref) => ({ title: ref.title.trim(), url: ref.url.trim() }))
    .filter((ref) => ref.title.length > 0 || ref.url.length > 0);

  if (sourceRefs.length === 0) {
    return {
      error: `${stepLabel}: 根拠（出典タイトル・URL）を1件以上入力してください（設計書AI原則「根拠必須」）。`,
    };
  }
  if (sourceRefs.some((ref) => ref.title.length === 0 || ref.url.length === 0)) {
    return { error: `${stepLabel}: 根拠のタイトル・URLは両方入力してください。` };
  }

  const relatedRegulationIds = linesToArray(step.relatedRegulationIds);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (relatedRegulationIds.some((id) => !uuidPattern.test(id))) {
    return { error: `${stepLabel}: 関連法規IDはUUID形式で1行につき1件入力してください。` };
  }

  return {
    input: {
      phaseCode: step.phaseCode,
      name: step.name.trim(),
      order,
      durationMinDays,
      durationMaxDays,
      costMinJpy,
      costMaxJpy,
      requiredDocuments: linesToArray(step.requiredDocuments),
      requiredTests: linesToArray(step.requiredTests),
      relatedRegulationIds,
      pmdaResourceUrls: linesToArray(step.pmdaResourceUrls),
      notes: step.notes.trim().length > 0 ? step.notes.trim() : null,
      sourceRefs,
    },
  };
}
