import type {
  PendingReviewVersionDetailResponse,
  PendingReviewVersionListResponse,
  PublishPendingReviewVersionResponse,
} from "@yakuji/shared";
import {
  pendingReviewVersionDetailResponseSchema,
  pendingReviewVersionListResponseSchema,
  publishPendingReviewVersionResponseSchema,
} from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 設計書⑫ S20（管理: 取込レビュー）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class PendingReviewApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new PendingReviewApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListPendingReviewVersionsParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/admin/ingestion/versions（設計書⑫ S20 一覧）。 */
export async function listPendingReviewVersions(
  accessToken: string,
  params: ListPendingReviewVersionsParams = {},
): Promise<PendingReviewVersionListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/admin/ingestion/versions${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "取込レビュー一覧の取得に失敗しました。");
  }

  return pendingReviewVersionListResponseSchema.parse(await response.json());
}

/** GET /api/v1/admin/ingestion/versions/:id（設計書⑫ S20 詳細）。 */
export async function getPendingReviewVersionDetail(
  accessToken: string,
  versionId: string,
): Promise<PendingReviewVersionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/ingestion/versions/${versionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "取込レビュー詳細の取得に失敗しました。");
  }

  return pendingReviewVersionDetailResponseSchema.parse(await response.json());
}

/** POST /api/v1/admin/ingestion/versions/:id/publish（設計書⑫ S20 公開）。 */
export async function publishPendingReviewVersion(
  accessToken: string,
  versionId: string,
): Promise<PublishPendingReviewVersionResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/ingestion/versions/${versionId}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "公開に失敗しました。時間をおいて再度お試しください。");
  }

  return publishPendingReviewVersionResponseSchema.parse(await response.json());
}
