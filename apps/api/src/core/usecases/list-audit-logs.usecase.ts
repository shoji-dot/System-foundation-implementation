import { Inject, Injectable } from "@nestjs/common";

import type { AuditLogListResult, AuditLogRepository } from "../domain/audit-log.repository";
import { AUDIT_LOG_REPOSITORY } from "../domain/audit-log.repository";

export interface ListAuditLogsInput {
  cursor?: string;
  limit: number;
}

/**
 * 監査ログ一覧取得ユースケース（設計書④ audit_logs、Phase6 商用化「監査ログ」閲覧機能）。
 * 設計書⑤のAPI一覧に明記は無いが、記録済みログを閲覧する手段としてユーザー承認のうえ追加する。
 */
@Injectable()
export class ListAuditLogsUsecase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(input: ListAuditLogsInput): Promise<AuditLogListResult> {
    return this.auditLogRepository.list(input);
  }
}
