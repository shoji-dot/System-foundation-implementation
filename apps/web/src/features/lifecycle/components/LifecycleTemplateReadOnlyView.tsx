import type { LifecycleTemplateDetailResponse } from "@yakuji/shared";
import { LIFECYCLE_PHASE_LABELS } from "@yakuji/shared";

interface LifecycleTemplateReadOnlyViewProps {
  detail: LifecycleTemplateDetailResponse;
}

/**
 * S22 工程マスタ詳細の閲覧専用表示（PUBLISHED、設計変更書③「不変原則」により編集不可）。
 * サーバーコンポーネントから利用する想定のためuseState等は持たない。
 */
export function LifecycleTemplateReadOnlyView({ detail }: LifecycleTemplateReadOnlyViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {[...detail.steps]
        .sort((a, b) => a.order - b.order)
        .map((step) => (
          <div
            key={step.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
          >
            <h3 className="text-[16px] font-semibold text-text">
              {step.order + 1}. {step.name}
              <span className="ml-2 text-[14px] font-normal text-text-secondary">
                （{LIFECYCLE_PHASE_LABELS[step.phase.code]}）
              </span>
            </h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-[14px] text-text md:grid-cols-2">
              <div className="flex gap-1">
                <dt className="font-medium">想定期間:</dt>
                <dd>
                  {step.durationMinDays ?? "—"}〜{step.durationMaxDays ?? "—"}日
                </dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-medium">概算費用:</dt>
                <dd>
                  {step.costMinJpy ?? "—"}〜{step.costMaxJpy ?? "—"}円
                </dd>
              </div>
            </dl>
            {step.requiredDocuments && step.requiredDocuments.length > 0 ? (
              <p className="text-[14px] text-text">
                <span className="font-medium">必要書類:</span> {step.requiredDocuments.join("、")}
              </p>
            ) : null}
            {step.requiredTests && step.requiredTests.length > 0 ? (
              <p className="text-[14px] text-text">
                <span className="font-medium">必要試験:</span> {step.requiredTests.join("、")}
              </p>
            ) : null}
            {step.notes ? <p className="text-[14px] text-text-secondary">{step.notes}</p> : null}
            {step.sourceRefs && step.sourceRefs.length > 0 ? (
              <ul className="flex flex-col gap-1 text-[13px] text-text-secondary">
                {step.sourceRefs.map((ref) => (
                  <li key={ref.url}>
                    根拠: {ref.title}（{ref.url}）
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
    </div>
  );
}
