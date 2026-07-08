import type { ReactNode } from "react";

import type { LegalBlock } from "../lib/parseLegalText";
import { parseLegalText } from "../lib/parseLegalText";

interface LegalDocumentProps {
  title: string;
  content: string;
}

const BOLD_PATTERN = /\*\*(.+?)\*\*/g;

/**
 * "**text**" 形式の強調のみをサポートする最小限のインラインパーサー。
 * 見出し番号ではなく用語の強調（第3条の限界一覧の見出し語等）にのみ使用する。
 */
function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchCount = 0;

  for (const match of text.matchAll(BOLD_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }
    nodes.push(<strong key={`b-${matchCount}`}>{match[1]}</strong>);
    matchCount += 1;
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-8 text-[20px] font-semibold text-text first:mt-0">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-6 text-[17px] font-semibold text-text">{block.text}</h3>;
    case "quote":
      return (
        <blockquote className="rounded-sm border-l-4 border-accent bg-surface p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-text-secondary">
          {renderInline(block.text)}
        </blockquote>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-text">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-text">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {renderInline(item.text)}
              {item.children.length > 0 ? (
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-text-secondary">
                  {item.children.map((child, childIndex) => (
                    <li key={childIndex}>{renderInline(child)}</li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      );
    case "p":
      return (
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-text">
          {renderInline(block.text)}
        </p>
      );
    default:
      return null;
  }
}

/**
 * 設計書には個別画面定義が無いため、法務文書（利用規約・プライバシーポリシー・AI利用ポリシー・
 * 情報セキュリティポリシー）表示用の共通レイアウトとして新規追加。
 * 限定的なMarkdownサブセットをパースし、見出し階層を保ったまま表示することで
 * スクリーンリーダー等でのセクション移動を可能にする（アクセシビリティ対応）。
 * ページタイトルをh1、章・条見出しをh2/h3として扱う。
 */
export function LegalDocument({ title, content }: LegalDocumentProps) {
  const blocks = parseLegalText(content);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8 pb-16">
      <h1 className="text-2xl font-semibold text-text">{title}</h1>
      <div className="flex flex-col gap-4">
        {blocks.map((block, index) => (
          <LegalBlockView key={index} block={block} />
        ))}
      </div>
    </main>
  );
}
