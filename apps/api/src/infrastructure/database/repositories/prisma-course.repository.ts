import { Injectable } from "@nestjs/common";
import type { Course as PrismaCourse } from "@prisma/client";

import type { Course } from "../../../core/domain/course.entity";
import type {
  CourseListFilters,
  CourseListResult,
  CourseRepository,
} from "../../../core/domain/course.repository";
import { PrismaService } from "../prisma.service";

/**
 * CourseRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 一覧は体系カリキュラムの表示順(order)で並べる（設計書⑫ S10）。order は一意ではないため、
 * cursor には id（UUIDv7）を使い、Prismaのカーソルは orderBy と独立に基準行を特定できる点を利用する
 * （orderBy: [order asc, id asc] のまま id を起点にページングする）。
 */
@Injectable()
export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: CourseListFilters): Promise<CourseListResult> {
    const records = await this.prisma.course.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record: PrismaCourse) => this.toDomain(record)),
      nextCursor,
    };
  }

  async findById(id: string): Promise<Course | null> {
    const record = await this.prisma.course.findUnique({ where: { id } });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: PrismaCourse): Course {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      order: record.order,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
