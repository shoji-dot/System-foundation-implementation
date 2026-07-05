import { Injectable } from "@nestjs/common";
import type { Notification as PrismaNotification } from "@prisma/client";

import type { Notification } from "../../../core/domain/notification.entity";
import type {
  CreateNotificationInput,
  ListNotificationsForUserInput,
  ListNotificationsResult,
  NotificationRepository,
} from "../../../core/domain/notification.repository";
import { PrismaService } from "../prisma.service";

/**
 * NotificationRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        regulationVersionId: input.regulationVersionId,
        title: input.title,
        body: input.body,
      })),
    });
  }

  async findManyForUser(input: ListNotificationsForUserInput): Promise<ListNotificationsResult> {
    const records = await this.prisma.notification.findMany({
      where: { userId: input.userId },
      // idはUUIDv7で生成順に単調増加するため、降順にすることで新着順表示を実現する
      // （既存のid昇順カーソル方式(update-feed等)と対称の並び）。
      orderBy: { id: "desc" },
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > input.limit;
    const page = hasMore ? records.slice(0, input.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record) => this.toDomain(record)),
      nextCursor,
    };
  }

  private toDomain(record: PrismaNotification): Notification {
    return {
      id: record.id,
      userId: record.userId,
      regulationVersionId: record.regulationVersionId,
      title: record.title,
      body: record.body,
      isRead: record.isRead,
      createdAt: record.createdAt,
    };
  }
}
