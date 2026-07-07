import { Inject, Injectable } from "@nestjs/common";

import type { AuditLog } from "../domain/audit-log.entity";
import type { AuditLogRepository, CreateAuditLogInput } from "../domain/audit-log.repository";
import { AUDIT_LOG_REPOSITORY } from "../domain/audit-log.repository";

/**
 * 監査ログ記録ユースケース（設計書④ audit_logs、Phase6 商用化「監査ログ」）。
 * 各モジュールのユースケースが admin/editor 操作等を記録する際にDIで利用する
 * （設計書③「依存方向: infrastructure → usecases → domain」に従い、呼び出し元は本ユースケースのみに依存する）。
 * 本コミットは記録基盤のみで、各モジュールからの実際の呼び出し組み込みは次回以降。
 */
@Injectable()
export class RecordAuditLogUsecase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(input: CreateAuditLogInput): Promise<AuditLog> {
    return this.auditLogRepository.create(input);
  }
}
