import { Injectable } from "@nestjs/common";

import type { OrganizationMembership } from "../../../core/domain/membership.entity";
import type { MembershipRepository } from "../../../core/domain/membership.repository";
import { PrismaService } from "../prisma.service";

/**
 * MembershipRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 */
@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyForUser(userId: string): Promise<OrganizationMembership[]> {
    const records = await this.prisma.membership.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { organization: true },
    });

    return records.map((record) => ({
      organizationId: record.organization.id,
      organizationName: record.organization.name,
      organizationType: record.organization.type,
      role: record.role,
    }));
  }
}
