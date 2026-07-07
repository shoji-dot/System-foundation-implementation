import { Injectable } from "@nestjs/common";
import type { ProjectTask as PrismaProjectTask } from "@prisma/client";

import type { ProjectTask, TaskStatus } from "../../../core/domain/project-task.entity";
import type {
  CreateProjectTaskInput,
  ProjectTaskRepository,
} from "../../../core/domain/project-task.repository";
import { PrismaService } from "../prisma.service";

/**
 * ProjectTaskRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * 一覧はid（UUIDv7、生成順に単調増加）を使った作成順表示（PrismaProjectRepositoryと同じ方針）。
 */
@Injectable()
export class PrismaProjectTaskRepository implements ProjectTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyForProject(projectId: string): Promise<ProjectTask[]> {
    const records = await this.prisma.projectTask.findMany({
      where: { projectId },
      orderBy: { id: "asc" },
    });

    return records.map((record) => this.toDomain(record));
  }

  async create(input: CreateProjectTaskInput): Promise<ProjectTask> {
    const record = await this.prisma.projectTask.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        dueDate: input.dueDate,
        assignee: input.assignee,
      },
    });

    return this.toDomain(record);
  }

  async findByIdForProject(id: string, projectId: string): Promise<ProjectTask | null> {
    const record = await this.prisma.projectTask.findFirst({
      where: { id, projectId },
    });

    return record ? this.toDomain(record) : null;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<ProjectTask> {
    const record = await this.prisma.projectTask.update({
      where: { id },
      data: { status },
    });

    return this.toDomain(record);
  }

  private toDomain(record: PrismaProjectTask): ProjectTask {
    return {
      id: record.id,
      projectId: record.projectId,
      title: record.title,
      checklistItemRef: record.checklistItemRef,
      status: record.status,
      dueDate: record.dueDate,
      assignee: record.assignee,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
