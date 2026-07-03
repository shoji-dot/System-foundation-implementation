import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * PostgreSQL 接続クライアント（Repository 実装から利用する）。
 * 設計書 ③: infrastructure/database 配下、ORM は Prisma。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("PostgreSQL connected via Prisma");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
