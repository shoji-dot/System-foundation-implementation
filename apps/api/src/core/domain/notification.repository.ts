import type { Notification } from "./notification.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaNotificationRepository）。
 */
export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");

export interface CreateNotificationInput {
  userId: string;
  regulationVersionId: string;
  title: string;
  body: string | null;
}

/** GET /api/v1/notifications向け。カーソルはid（UUIDv7）降順のキーセット方式（新着順表示のため）。 */
export interface ListNotificationsForUserInput {
  userId: string;
  cursor?: string;
  limit: number;
}

export interface ListNotificationsResult {
  items: Notification[];
  nextCursor: string | null;
}

export interface NotificationRepository {
  /**
   * 公開(publish)時に、一致する購読者ぶんの通知をまとめて作成する
   * （設計書⑨「published時: 購読ユーザーへ通知」、アプリ内通知のみ。メール配信は保留中）。
   */
  createMany(inputs: CreateNotificationInput[]): Promise<void>;
  /** ログイン中のユーザー自身の通知一覧を新着順で返す（GET /api/v1/notifications）。 */
  findManyForUser(input: ListNotificationsForUserInput): Promise<ListNotificationsResult>;
}
