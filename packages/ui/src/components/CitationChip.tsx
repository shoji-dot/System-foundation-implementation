import type { AnchorHTMLAttributes } from "react";

/**
 * 設計書⑭「コンポーネント再利用: ...CitationChip(AI出典)」。
 * S14(AIチャット)の出典表示・S07への遷移（「出典タップ→S07該当条文」）で使う共通コンポーネント。
 * リンク先の組み立て（/regulations/:id#section-:sectionId 等）は呼び出し側（features/ai）が担う。
 */
export interface CitationChipProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 例: 「医薬品医療機器等法 第23条の2」。 */
  label: string;
}

export function CitationChip({ label, className = "", ...props }: CitationChipProps) {
  return (
    <a
      {...props}
      className={[
        // 見た目はコンパクトなpill(チップ)だが、タップ領域は設計書⑭「44pxタップ領域」に合わせ
        // min-h-[44px]を確保する（他コンポーネントのインラインリンクと同方針）。
        "inline-flex min-h-[44px] items-center rounded-full border border-border bg-surface px-3",
        "text-[13px] font-medium text-accent hover:opacity-80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      ].join(" ")}
    >
      {label}
    </a>
  );
}
