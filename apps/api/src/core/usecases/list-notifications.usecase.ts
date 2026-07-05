import { Inject, Injectable } from "@nestjs/common";

import type {
  ListNotificationsResult,
  NotificationRepository,
} from "../domain/notification.repository";
import { NOTIFICATION_REPOSITORY } from "../domain/notification.repository";

export interface ListNotificationsInput {
  userId: string;
  cursor?: string;
  limit: number;
}

/**
 * 通知一覧取得ユースケース（GET /api/v1/notifications、設計書⑨通知生成と対のAPI）。
 * ログイン中のユーザー自身の通知のみを対象とする。
 */
@Injectable()
export class ListNotificationsUsecase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(input: ListNotificationsInput): Promise<ListNotificationsResult> {
    return this.notificationRepository.findManyForUser(input);
  }
}
