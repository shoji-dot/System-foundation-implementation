import type { AiChatCitationResponse } from "@yakuji/shared";
import { CitationChip } from "@yakuji/ui";

interface CitationListProps {
  citations: AiChatCitationResponse[];
}

/**
 * S14「出典表示」。設計書⑬「出典タップ→S07該当条文」に対応し、
 * S07（/regulations/[id]）の該当セクションへ`#section-{sectionId}`アンカーで直接遷移する
 * （RegulationSectionsが各セクションに`id={`section-${section.id}`}`を付与済みのため追加実装不要）。
 */
export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {citations.map((citation) => (
        <CitationChip
          key={citation.sectionId}
          href={`/regulations/${citation.regulationId}#section-${citation.sectionId}`}
          label={`${citation.regulationTitle} ${citation.path}`}
          title={`${citation.jurisdiction.name} 第${citation.versionNo}版・施行日: ${citation.effectiveFrom}`}
        />
      ))}
    </div>
  );
}
