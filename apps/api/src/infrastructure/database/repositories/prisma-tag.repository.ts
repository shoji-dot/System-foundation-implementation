import { Injectable } from "@nestjs/common";
import type { Tag as PrismaTag } from "@prisma/client";

import type { Tag } from "../../../core/domain/tag.entity";
import type {
  CreateTagInput,
  ListTagsFilters,
  TagListResult,
  TagRepository,
  UpdateTagInput,
} from "../../../core/domain/tag.repository";
import { PrismaService } from "../prisma.service";

/**
 * TagRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaTagRepository implements TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTagInput): Promise<Tag> {
    const record = await this.prisma.tag.create({
      data: { name: input.name },
    });

    return this.toDomain(record);
  }

  async list(filters: ListTagsFilters): Promise<TagListResult> {
    // UUIDv7のidは生成順に単調増加するため、id desc で新しい記録から返す
    // （監査ログ一覧listと同様のカーソルページネーション方式）。
    const records = await this.prisma.tag.findMany({
      orderBy: { id: "desc" },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > filters.limit;
    const page = hasMore ? records.slice(0, filters.limit) : records;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return {
      items: page.map((record) => this.toDomain(record)),
      nextCursor,
    };
  }

  async findById(id: string): Promise<Tag | null> {
    const record = await this.prisma.tag.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const record = await this.prisma.tag.findUnique({ where: { name } });
    return record ? this.toDomain(record) : null;
  }

  async update(id: string, input: UpdateTagInput): Promise<Tag> {
    const record = await this.prisma.tag.update({
      where: { id },
      data: { name: input.name },
    });

    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tag.delete({ where: { id } });
  }

  private toDomain(record: PrismaTag): Tag {
    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
