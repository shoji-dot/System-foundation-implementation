/**
 * S20 取込レビュー詳細（校閲画面）向けの行単位差分。
 * バックエンド(GET /admin/ingestion/versions/:id)はfullText全文のみを返す
 * （regulation_sectionsは取込パイプラインが現時点で生成しないため、既存の
 * /regulations/:id/diffと同じセクション単位の突合は使えない）。フロント側で
 * 行単位の簡易差分を計算し、校閲時に変更箇所が分かるようにする。
 */
export type LineDiffType = "unchanged" | "added" | "removed";

export interface LineDiffEntry {
  type: LineDiffType;
  text: string;
}

/** これを超える行数の組み合わせでは計算コストが大きいため差分計算を打ち切る（安全弁）。 */
const MAX_DIFF_CELLS = 4_000_000;

/**
 * 標準的なLCS(最長共通部分列)ベースの行差分。追加のnpm依存を増やさないための自前実装。
 * 行数が多すぎる場合は計算を打ち切り、nullを返す（呼び出し側は全文をそのまま表示する）。
 */
export function diffLines(oldText: string, newText: string): LineDiffEntry[] | null {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);

  if (oldLines.length * newLines.length > MAX_DIFF_CELLS) {
    return null;
  }

  const oldLength = oldLines.length;
  const newLength = newLines.length;

  // lcsLength[i][j] = oldLines[i..]とnewLines[j..]のLCS長。
  const lcsLength: number[][] = Array.from({ length: oldLength + 1 }, () =>
    new Array<number>(newLength + 1).fill(0),
  );

  for (let i = oldLength - 1; i >= 0; i -= 1) {
    for (let j = newLength - 1; j >= 0; j -= 1) {
      lcsLength[i]![j] =
        oldLines[i] === newLines[j]
          ? lcsLength[i + 1]![j + 1]! + 1
          : Math.max(lcsLength[i + 1]![j]!, lcsLength[i]![j + 1]!);
    }
  }

  const entries: LineDiffEntry[] = [];
  let i = 0;
  let j = 0;
  while (i < oldLength && j < newLength) {
    if (oldLines[i] === newLines[j]) {
      entries.push({ type: "unchanged", text: oldLines[i]! });
      i += 1;
      j += 1;
    } else if (lcsLength[i + 1]![j]! >= lcsLength[i]![j + 1]!) {
      entries.push({ type: "removed", text: oldLines[i]! });
      i += 1;
    } else {
      entries.push({ type: "added", text: newLines[j]! });
      j += 1;
    }
  }
  while (i < oldLength) {
    entries.push({ type: "removed", text: oldLines[i]! });
    i += 1;
  }
  while (j < newLength) {
    entries.push({ type: "added", text: newLines[j]! });
    j += 1;
  }

  return entries;
}
