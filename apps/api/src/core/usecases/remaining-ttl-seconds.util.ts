/** トークンの残り有効期限（秒）を返す。既に期限切れの場合でも最低1秒を返す（Redis EXに0以下を渡さないため）。 */
export function remainingTtlSeconds(expiresAt: Date): number {
  const seconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  return Math.max(seconds, 1);
}
