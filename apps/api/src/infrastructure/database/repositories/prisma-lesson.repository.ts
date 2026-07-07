import { Injectable } from "@nestjs/common";
import type { Lesson as PrismaLesson, Prisma } from "@prisma/client";

import type { Lesson, LessonSummary } from "../../../core/domain/lesson.entity";
import type {
  CreateLessonInput,
  LessonListFilters,
  LessonListResult,
  LessonRepository,
  UpdateLessonInput,
} from "../../../core/domain/lesson.repository";
import { PrismaService } from "../prisma.service";

/**
 * LessonRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 一覧はコース内の表示順(order)で並べる（設計書⑫ S11）。order はコース内でのみ一意
 * (@@unique([courseId, order]))なため、courses一覧と同様に id を起点としたページングを用いる。
 */
@Injectable()
export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: LessonListFilters): Promise<LessonListResult> {
    const where: Prisma.LessonWhereInput = {};
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }

    const records = await this.prisma.lesson.findMany({
      where,
      orderBy: [{ order: "asc" }, { id: "asc" }],
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: PrismaLesson) => this.toDomain(record)),
      nextCursor,
    };
  }

  async findDetailById(id: string): Promise<Lesson | null> {
    const record = await this.prisma.lesson.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return this.toFullDomain(record);
  }

  async findByCourseIdAndOrder(courseId: string, order: number): Promise<Lesson | null> {
    const record = await this.prisma.lesson.findUnique({
      where: { courseId_order: { courseId, order } },
    });

    return record ? this.toFullDomain(record) : null;
  }

  async create(input: CreateLessonInput): Promise<Lesson> {
    const record = await this.prisma.lesson.create({
      data: {
        courseId: input.courseId,
        title: input.title,
        body: input.body,
        order: input.order,
      },
    });

    return this.toFullDomain(record);
  }

  async update(id: string, input: UpdateLessonInput): Promise<Lesson> {
    const record = await this.prisma.lesson.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
    });

    return this.toFullDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lesson.delete({ where: { id } });
  }

  private toDomain(record: PrismaLesson): LessonSummary {
    return {
      id: record.id,
      courseId: record.courseId,
      title: record.title,
      order: record.order,
    };
  }

  private toFullDomain(record: PrismaLesson): Lesson {
    return {
      id: record.id,
      courseId: record.courseId,
      title: record.title,
      body: record.body,
      order: record.order,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
