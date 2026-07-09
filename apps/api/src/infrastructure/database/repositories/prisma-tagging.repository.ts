import { Injectable } from "@nestjs/common";
import type { Tag as PrismaTag, Tagging as PrismaTagging } from "@prisma/client";

import type { Tag } from "../../../core/domain/tag.entity";
import type { Tagging, TaggableType } from "../../../core/domain/tagging.entity";
import type {
  CreateTaggingInput,
  TaggingRepository,
} from "../../../core/domain/tagging.repository";
import { PrismaService } from "../prisma.service";

/**
 * TaggingRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaTaggingRepository implements TaggingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTaggingInput): Promise<Tagging> {
    const record = await this.prisma.tagging.create({
      data: {
        tagId: input.tagId,
        taggableType: input.taggableType,
        taggableId: input.taggableId,
      },
    });

    return this.toDomain(record);
  }

  async exists(tagId: string, taggableType: TaggableType, taggableId: string): Promise<boolean> {
    const record = await this.prisma.tagging.findUnique({
      where: { tagId_taggableType_taggableId: { tagId, taggableType, taggableId } },
    });

    return record !== null;
  }

  async delete(tagId: string, taggableType: TaggableType, taggableId: string): Promise<void> {
    await this.prisma.tagging.delete({
      where: { tagId_taggableType_taggableId: { tagId, taggableType, taggableId } },
    });
  }

  async deleteAllForTaggable(taggableType: TaggableType, taggableId: string): Promise<void> {
    await this.prisma.tagging.deleteMany({ where: { taggableType, taggableId } });
  }

  async listTagsForTaggable(taggableType: TaggableType, taggableId: string): Promise<Tag[]> {
    const records = await this.prisma.tagging.findMany({
      where: { taggableType, taggableId },
      include: { tag: true },
      orderBy: { createdAt: "asc" },
    });

    return records.map((record) => this.toTagDomain(record.tag));
  }

  private toDomain(record: PrismaTagging): Tagging {
    return {
      id: record.id,
      tagId: record.tagId,
      taggableType: record.taggableType,
      taggableId: record.taggableId,
      createdAt: record.createdAt,
    };
  }

  private toTagDomain(record: PrismaTag): Tag {
    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
