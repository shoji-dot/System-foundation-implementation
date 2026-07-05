/**
 * アプリ内通知（設計書⑨「published時: 購読ユーザーへ通知（アプリ内+メール）」準拠、S17）。
 * 設計書④に列定義が無いため、update_subscriptionsと同様にユーザー承認済みで追加したドメインモデル。
 */
export interface Notification {
  id: string;
  userId: string;
  regulationVersionId: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: Date;
}
