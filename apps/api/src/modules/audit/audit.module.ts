import { Global, Module } from "@nestjs/common";

import { AUDIT_LOG_REPOSITORY } from "../../core/domain/audit-log.repository";
import { RecordAuditLogUsecase } from "../../core/usecases/record-audit-log.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaAuditLogRepository } from "../../infrastructure/database/repositories/prisma-audit-log.repository";

/**
 * 監査ログモジュール（設計書④ audit_logs、Phase6 商用化）。
 * PrismaModule同様 @Global とし、各 modules/* のユースケースが RecordAuditLogUsecase を
 * DIで利用できるようにする（監査ログは全モジュール横断の関心事のため）。
 * 本コミットは記録基盤のみ。各モジュールの実操作への呼び出し組み込み、および一覧取得API
 * （S21管理: コンテンツ管理向け、設計書⑤に該当エンドポイント記載は無い）は次回以降で検討する。
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    RecordAuditLogUsecase,
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  ],
  exports: [RecordAuditLogUsecase],
})
export class AuditModule {}
