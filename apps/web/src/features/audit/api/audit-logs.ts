import type { AuditLogListResponse } from "@yakuji/shared";
import { auditLogListResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 監査ログ閲覧画面向けAPIクライアント（設計書④ audit_logs、Phase6 商用化）。
 * S20（取込レビュー）のAPIクライアントと同様、Reactに依存しない純粋関数として実装する。
 */
export class AuditLogApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new AuditLogApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListAuditLogsParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/admin/audit-logs（監査ログ一覧、editor/admin限定）。 */
export async function listAuditLogs(
  accessToken: string,
  params: ListAuditLogsParams = {},
): Promise<AuditLogListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/admin/audit-logs${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "監査ログ一覧の取得に失敗しました。");
  }

  return auditLogListResponseSchema.parse(await response.json());
}
