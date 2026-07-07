import { Injectable } from "@nestjs/common";
import type { Course, Lesson, UserProgress as PrismaUserProgress } from "@prisma/client";

import type {
  Progress,
  ProgressListItem,
  ProgressListResult,
  ProgressSummary,
} from "../../../core/domain/progress.entity";
import type {
  ProgressListFilters,
  ProgressRepository,
  UpsertProgressInput,
} from "../../../core/domain/progress.repository";
import { PrismaService } from "../prisma.service";

type PrismaUserProgressWithLesson = PrismaUserProgress & {
  lesson: Lesson & { course: Course };
};

/**
 * ProgressRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * user_progress の一意制約(userId, lessonId、Prismaの複合キー名は既定の userId_lessonId)でupsertする。
 */
@Injectable()
export class PrismaProgressRepository implements ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: UpsertProgressInput): Promise<Progress> {
    // completedAtはクライアントから受け取らず、statusがCOMPLETEDの場合にのみサーバー側で設定する。
    const completedAt = input.status === "COMPLETED" ? new Date() : null;
    const score = input.score ?? null;

    const record = await this.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: input.userId, lessonId: input.lessonId } },
      create: {
        userId: input.userId,
        lessonId: input.lessonId,
        status: input.status,
        score,
        completedAt,
      },
      update: {
        status: input.status,
        score,
        completedAt,
      },
    });

    return this.toDomain(record);
  }

  async getSummaryForUser(userId: string): Promise<ProgressSummary> {
    const [totalLessons, completedCount, inProgressCount] = await Promise.all([
      this.prisma.lesson.count(),
      this.prisma.userProgress.count({ where: { userId, status: "COMPLETED" } }),
      this.prisma.userProgress.count({ where: { userId, status: "IN_PROGRESS" } }),
    ]);

    return { totalLessons, completedCount, inProgressCount };
  }

  async findManyByUserId(filters: ProgressListFilters): Promise<ProgressListResult> {
    const records = await this.prisma.userProgress.findMany({
      where: { userId: filters.userId },
      include: { lesson: { include: { course: true } } },
      // 直近に更新された進捗を先頭に表示する（S13「修了状況・スコア」一覧）。idを併用し
      // updatedAtが同一の場合でも一意にページングできるようにする（courses一覧と同方針）。
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: PrismaUserProgressWithLesson) => this.toListItemDomain(record)),
      nextCursor,
    };
  }

  private toDomain(record: PrismaUserProgress): Progress {
    return {
      id: record.id,
      lessonId: record.lessonId,
      status: record.status,
      score: record.score,
      completedAt: record.completedAt,
    };
  }

  private toListItemDomain(record: PrismaUserProgressWithLesson): ProgressListItem {
    return {
      ...this.toDomain(record),
      lessonTitle: record.lesson.title,
      courseId: record.lesson.courseId,
      courseTitle: record.lesson.course.title,
    };
  }
}
