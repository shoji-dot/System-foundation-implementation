import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { AuditLogListResponse } from "@yakuji/shared";
import { auditLogListResponseSchema } from "@yakuji/shared";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ListAuditLogsUsecase } from "../../core/usecases/list-audit-logs.usecase";

import { ListAuditLogsQueryDto } from "./dto/list-audit-logs-query.dto";

/**
 * 監査ログ閲覧API（設計書④ audit_logs、Phase6 商用化「監査ログ」）。
 * 設計書⑤のAPI一覧に本エンドポイントの明記は無いが、記録済みログを閲覧する手段として
 * ユーザー承認のうえ追加する。S20（admin/ingestion/versions）と同様 editor/admin 限定
 * （設計書⑦ RBAC）。S21「管理: コンテンツ管理」＝コース/タグ/ユーザー管理とは別画面として扱う。
 */
@Controller("admin/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class AuditLogsController {
  constructor(private readonly listAuditLogsUsecase: ListAuditLogsUsecase) {}

  @Get()
  async list(@Query() query: ListAuditLogsQueryDto): Promise<AuditLogListResponse> {
    const result = await this.listAuditLogsUsecase.execute({
      cursor: query.cursor,
      limit: query.limit,
    });

    return auditLogListResponseSchema.parse({
      items: result.items.map((item) => ({
        id: item.id,
        actorId: item.actorId,
        action: item.action,
        target: item.target,
        createdAt: item.createdAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    });
  }
}
