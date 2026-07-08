/**
 * テーマ設定（設計書⑭「ダークモード: OS追従+手動切替（S19）」準拠）。
 * サーバー永続化は行わず、Cookie（クライアント側のみ）で管理する方針とする
 * （デバイスごとに独立した表示設定であり、usersテーブルへの列追加は不要と判断、ユーザー承認済み）。
 */
export const THEME_COOKIE_NAME = "theme";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export function isThemePreference(value: string | undefined): value is ThemePreference {
  return value !== undefined && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/**
 * <html data-theme> に設定する値。"system"の場合はCSS側のprefers-color-schemeに委ねるため
 * 属性自体を付けない（packages/ui/src/tokens.cssのhtml[data-theme]セレクタと対応）。
 */
export function toHtmlDataTheme(preference: ThemePreference): "light" | "dark" | undefined {
  return preference === "system" ? undefined : preference;
}
