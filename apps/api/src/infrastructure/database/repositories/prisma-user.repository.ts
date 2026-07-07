import { Injectable } from "@nestjs/common";
import type { User as PrismaUser } from "@prisma/client";

import type { Plan, SystemRole, User } from "../../../core/domain/user.entity";
import type {
  ListUsersFilters,
  NewUser,
  UserListResult,
  UserRepository,
} from "../../../core/domain/user.repository";
import { PrismaService } from "../prisma.service";

/**
 * UserRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async create(input: NewUser): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
      },
    });
    return this.toDomain(record);
  }

  async list(filters: ListUsersFilters): Promise<UserListResult> {
    // UUIDv7のidは生成順に単調増加するため、id desc で新しい記録から返す
    // （タグ一覧・監査ログ一覧と同様のカーソルページネーション方式）。
    const records = await this.prisma.user.findMany({
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

  async updateRole(id: string, systemRole: SystemRole): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id },
      data: { systemRole },
    });
    return this.toDomain(record);
  }

  async updatePlan(id: string, plan: Plan): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id },
      data: { plan },
    });
    return this.toDomain(record);
  }

  private toDomain(record: PrismaUser): User {
    return {
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      name: record.name,
      locale: record.locale,
      systemRole: record.systemRole,
      plan: record.plan,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
