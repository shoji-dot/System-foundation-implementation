import type { SearchResponse, SearchScope } from "@yakuji/shared";
import { searchResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 統合検索（設計書⑤⑩ GET /api/v1/search、S05「検索窓+ファセット+スコープタブ」）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class SearchApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface SearchParams {
  q?: string;
  scope?: SearchScope;
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/search（S05）。 */
export async function search(
  accessToken: string,
  params: SearchParams = {},
): Promise<SearchResponse> {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.scope) {
    query.set("scope", params.scope);
  }
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(`${API_BASE_URL}/search${queryString ? `?${queryString}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new SearchApiError(problem?.detail ?? "検索に失敗しました。", response.status);
  }

  return searchResponseSchema.parse(await response.json());
}
