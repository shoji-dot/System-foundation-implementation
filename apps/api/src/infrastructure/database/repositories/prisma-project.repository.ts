import { Injectable } from "@nestjs/common";
import type { Project as PrismaProject } from "@prisma/client";

import type { Project } from "../../../core/domain/project.entity";
import type {
  CreateProjectInput,
  ListProjectsForUserInput,
  ListProjectsResult,
  ProjectRepository,
} from "../../../core/domain/project.repository";
import { PrismaService } from "../prisma.service";

/**
 * ProjectRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 一覧のカーソルページネーションは id（UUIDv7、生成順に単調増加）を使ったキーセット方式
 * （regulations一覧と同じ昇順=作成順表示）。
 */
@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyForUser(input: ListProjectsForUserInput): Promise<ListProjectsResult> {
    const records = await this.prisma.project.findMany({
      where: { userId: input.userId },
      orderBy: { id: "asc" },
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

  async create(input: CreateProjectInput): Promise<Project> {
    const record = await this.prisma.project.create({
      data: {
        userId: input.userId,
        name: input.name,
        deviceClass: input.deviceClass,
        targetJurisdictions: input.targetJurisdictions,
      },
    });

    return this.toDomain(record);
  }

  async findByIdForUser(id: string, userId: string): Promise<Project | null> {
    const record = await this.prisma.project.findFirst({
      where: { id, userId },
    });

    return record ? this.toDomain(record) : null;
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.project.count({ where: { userId } });
  }

  private toDomain(record: PrismaProject): Project {
    return {
      id: record.id,
      name: record.name,
      deviceClass: record.deviceClass,
      targetJurisdictions: record.targetJurisdictions,
      organizationId: record.organizationId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
