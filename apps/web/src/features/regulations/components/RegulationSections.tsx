import type { RegulationSectionResponse } from "@yakuji/shared";

interface RegulationSectionsProps {
  sections: RegulationSectionResponse[];
  fullText: string;
}

/**
 * S07「条文表示」。regulation_sectionsが条・項・号の階層で分割されている場合はその単位で表示し、
 * セクション未分割（取込パイプライン未対応等）の場合はfullTextをそのまま表示する。
 * サーバーコンポーネント（インタラクションを持たない純粋な表示）。
 */
export function RegulationSections({ sections, fullText }: RegulationSectionsProps) {
  if (sections.length === 0) {
    return (
      <pre className="max-h-[60vh] overflow-auto rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap text-text">
        {fullText}
      </pre>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`section-${section.id}`}>
          <h3
            id={`section-${section.id}`}
            className="text-[14px] font-medium text-text-secondary"
          >
            {section.path} {section.heading}
          </h3>
          <p className="mt-1 rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap text-text">
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );
}
