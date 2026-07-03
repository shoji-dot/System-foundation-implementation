import { Injectable } from "@nestjs/common";
import type { User as PrismaUser } from "@prisma/client";

import type { User } from "../../../core/domain/user.entity";
import type { NewUser, UserRepository } from "../../../core/domain/user.repository";
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
