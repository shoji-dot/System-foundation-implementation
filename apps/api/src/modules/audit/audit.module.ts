import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AUDIT_LOG_REPOSITORY } from "../../core/domain/audit-log.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { ListAuditLogsUsecase } from "../../core/usecases/list-audit-logs.usecase";
import { RecordAuditLogUsecase } from "../../core/usecases/record-audit-log.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaAuditLogRepository } from "../../infrastructure/database/repositories/prisma-audit-log.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { AuditLogsController } from "./audit-logs.controller";

/**
 * 監査ログモジュール（設計書④ audit_logs、Phase6 商用化）。
 * PrismaModule同様 @Global とし、各 modules/* のユースケースが RecordAuditLogUsecase を
 * DIで利用できるようにする（監査ログは全モジュール横断の関心事のため）。
 * 一覧閲覧API（AuditLogsController、GET /api/v1/admin/audit-logs）はeditor/admin限定
 * （設計書⑦ RBAC）のため、JwtAuthGuardが要求するTOKEN_SERVICEを他モジュール同様に
 * 自己完結で提供する。
 */
@Global()
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuditLogsController],
  providers: [
    RecordAuditLogUsecase,
    ListAuditLogsUsecase,
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [RecordAuditLogUsecase],
})
export class AuditModule {}
