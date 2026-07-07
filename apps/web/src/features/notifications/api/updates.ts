import type { UpdateFeedListResponse } from "@yakuji/shared";
import { updateFeedListResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 更新フィード（設計書⑤ GET /api/v1/updates、S04/S17）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class UpdateFeedApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface ListUpdateFeedParams {
  limit?: number;
}

/** GET /api/v1/updates（設計書⑤、S04「更新フィード」向けに最新n件を取得する用途）。 */
export async function listUpdateFeed(
  accessToken: string,
  params: ListUpdateFeedParams = {},
): Promise<UpdateFeedListResponse> {
  const query = new URLSearchParams();
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(`${API_BASE_URL}/updates${queryString ? `?${queryString}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new UpdateFeedApiError(
      problem?.detail ?? "更新フィードの取得に失敗しました。",
      response.status,
    );
  }

  return updateFeedListResponseSchema.parse(await response.json());
}
