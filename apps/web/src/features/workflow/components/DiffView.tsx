import { diffLines } from "../lib/line-diff";

export interface DiffViewProps {
  /** 現行公開版の本文。新規登録（比較対象なし）の場合はnull。 */
  oldText: string | null;
  newText: string;
}

/**
 * S20 取込レビュー詳細の差分表示。彩色は設計書⑭「アクセント1色のみ」に従い、
 * 新規追加行はaccent、削除行はdanger（いずれも既存デザイントークン）で表現する。
 * サーバーコンポーネント（インタラクションを持たない純粋な表示）。
 */
export function DiffView({ oldText, newText }: DiffViewProps) {
  if (oldText === null) {
    return (
      <div>
        <p className="mb-2 text-[14px] text-text-secondary">
          新規登録のため、比較対象の公開版はありません。
        </p>
        <pre className="max-h-[60vh] overflow-auto rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap text-text">
          {newText}
        </pre>
      </div>
    );
  }

  const entries = diffLines(oldText, newText);

  if (!entries) {
    return (
      <div>
        <p className="mb-2 text-[14px] text-text-secondary">
          本文が大きいため差分計算を省略しました。現行公開版と改正後の本文をそのまま表示します。
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section aria-label="現行公開版">
            <h3 className="mb-1 text-[14px] font-medium text-text-secondary">現行公開版</h3>
            <pre className="max-h-[60vh] overflow-auto rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap text-text">
              {oldText}
            </pre>
          </section>
          <section aria-label="改正後（校閲対象）">
            <h3 className="mb-1 text-[14px] font-medium text-text-secondary">改正後（校閲対象）</h3>
            <pre className="max-h-[60vh] overflow-auto rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap text-text">
              {newText}
            </pre>
          </section>
        </div>
      </div>
    );
  }

  return (
    <pre
      aria-label="改正差分（強調色: 追加行、取り消し線: 削除行）"
      className="max-h-[60vh] overflow-auto rounded-sm border border-border bg-surface p-4 text-[14px] whitespace-pre-wrap"
    >
      {entries.map((entry, index) => (
        <div
          key={index}
          className={
            entry.type === "added"
              ? "font-medium text-accent"
              : entry.type === "removed"
                ? "text-danger line-through"
                : "text-text"
          }
        >
          {entry.type === "added" ? "+ " : entry.type === "removed" ? "- " : "  "}
          {entry.text || " "}
        </div>
      ))}
    </pre>
  );
}
