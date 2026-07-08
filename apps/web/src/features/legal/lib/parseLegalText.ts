/**
 * 法務文書（利用規約・プライバシーポリシー等）表示用の、限定的なMarkdownサブセットパーサー。
 * 対応する記法は以下のみ:
 *   - "## " / "### "  見出し（h2 / h3）
 *   - "- "             箇条書き（同一ブロックが連続する行はまとめる）
 *   - "1. " 等          順序付きリスト。先頭に空白がある場合は直前の順序付き項目の
 *                       ネスト項目（子リスト）として扱う（1階層のみ）
 *   - "> "             引用（注記）
 *   - 空行              直前のブロックを確定
 *   - それ以外          通常の段落
 *
 * 法務文書は分量が多く更新頻度も高くないため、外部Markdownライブラリを追加するほどの
 * 複雑さではないと判断し、必要な記法のみをサポートする自前実装とした（YAGNI）。
 * 日本語の文章は単語間にスペースを挟まないため、折り返された段落の行は
 * スペースを挿入せずそのまま連結する。
 */

export interface LegalOrderedItem {
  text: string;
  children: string[];
}

export type LegalBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: LegalOrderedItem[] }
  | { type: "quote"; text: string };

const H2_PREFIX = "## ";
const H3_PREFIX = "### ";
const UL_PREFIX = "- ";
const QUOTE_PREFIX = "> ";
const TOP_ORDERED_PATTERN = /^(\d+)\.\s+(.*)$/;
const NESTED_ORDERED_PATTERN = /^\s+(\d+)\.\s+(.*)$/;

export function parseLegalText(source: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraphBuffer: string[] = [];
  let quoteBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: "p", text: paragraphBuffer.join("") });
      paragraphBuffer = [];
    }
  };

  const flushQuote = () => {
    if (quoteBuffer.length > 0) {
      blocks.push({ type: "quote", text: quoteBuffer.join("\n") });
      quoteBuffer = [];
    }
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") {
      flushParagraph();
      flushQuote();
      continue;
    }

    if (line.startsWith(QUOTE_PREFIX)) {
      flushParagraph();
      quoteBuffer.push(line.slice(QUOTE_PREFIX.length));
      continue;
    }
    flushQuote();

    if (line.startsWith(H2_PREFIX)) {
      flushParagraph();
      blocks.push({ type: "h2", text: line.slice(H2_PREFIX.length) });
      continue;
    }

    if (line.startsWith(H3_PREFIX)) {
      flushParagraph();
      blocks.push({ type: "h3", text: line.slice(H3_PREFIX.length) });
      continue;
    }

    if (line.startsWith(UL_PREFIX)) {
      flushParagraph();
      const text = line.slice(UL_PREFIX.length);
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") {
        last.items.push(text);
      } else {
        blocks.push({ type: "ul", items: [text] });
      }
      continue;
    }

    const nestedMatch = NESTED_ORDERED_PATTERN.exec(line);
    if (nestedMatch) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ol" && last.items.length > 0) {
        last.items[last.items.length - 1]?.children.push(nestedMatch[2] ?? "");
        continue;
      }
      // 直前に順序付きリストが無い場合は通常の段落として扱う（フォールバック）。
    }

    const topMatch = TOP_ORDERED_PATTERN.exec(line);
    if (topMatch) {
      flushParagraph();
      const item: LegalOrderedItem = { text: topMatch[2] ?? "", children: [] };
      const last = blocks[blocks.length - 1];
      if (last?.type === "ol") {
        last.items.push(item);
      } else {
        blocks.push({ type: "ol", items: [item] });
      }
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  flushQuote();

  return blocks;
}
