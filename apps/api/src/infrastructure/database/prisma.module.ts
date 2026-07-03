import { Global, Module } from "@nestjs/common";

import { PrismaService } from "./prisma.service";

/**
 * @Global: 各 modules/* のリポジトリ実装から DI で共有利用する。
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
