import { Injectable } from "@nestjs/common";
import type { UserProgress as PrismaUserProgress } from "@prisma/client";

import type { Progress } from "../../../core/domain/progress.entity";
import type {
  ProgressRepository,
  UpsertProgressInput,
} from "../../../core/domain/progress.repository";
import { PrismaService } from "../prisma.service";

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

  private toDomain(record: PrismaUserProgress): Progress {
    return {
      id: record.id,
      lessonId: record.lessonId,
      status: record.status,
      score: record.score,
      completedAt: record.completedAt,
    };
  }
}
