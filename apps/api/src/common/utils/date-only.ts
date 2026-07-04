/**
 * Date を YYYY-MM-DD 形式の日付のみ文字列に変換する（応答スキーマの date-only フィールド用）。
 * null はそのまま null を返す。
 */
export function toDateOnlyString(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
