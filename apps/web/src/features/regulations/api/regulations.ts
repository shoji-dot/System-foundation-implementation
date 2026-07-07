import type {
  JurisdictionCode,
  RegulationDetailResponse,
  RegulationDiffResponse,
  RegulationListResponse,
  RegulationType,
  RegulationVersionListResponse,
} from "@yakuji/shared";
import {
  regulationDetailResponseSchema,
  regulationDiffResponseSchema,
  regulationListResponseSchema,
  regulationVersionListResponseSchema,
} from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 法規文書（設計書⑤ GET /api/v1/regulations、/regulations/:id、/regulations/:id/versions、
 * /regulations/:id/diff、S06「国・タイプ別ブラウズ」、S07「条文表示・版切替・改正差分」）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class RegulationApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new RegulationApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListRegulationsParams {
  jurisdiction?: JurisdictionCode;
  type?: RegulationType;
  q?: string;
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/regulations（S06 一覧、国・タイプ・キーワード絞り込み）。 */
export async function listRegulations(
  accessToken: string,
  params: ListRegulationsParams = {},
): Promise<RegulationListResponse> {
  const query = new URLSearchParams();
  if (params.jurisdiction) {
    query.set("jurisdiction", params.jurisdiction);
  }
  if (params.type) {
    query.set("type", params.type);
  }
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/regulations${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "法規文書一覧の取得に失敗しました。");
  }

  return regulationListResponseSchema.parse(await response.json());
}

/** GET /api/v1/regulations/:id（S07 詳細、最新版の本文・条文セクションを含む）。 */
export async function getRegulationDetail(
  accessToken: string,
  regulationId: string,
): Promise<RegulationDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/regulations/${regulationId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "法規文書詳細の取得に失敗しました。");
  }

  return regulationDetailResponseSchema.parse(await response.json());
}

export interface ListRegulationVersionsParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/regulations/:id/versions（S07 改正履歴一覧）。 */
export async function listRegulationVersions(
  accessToken: string,
  regulationId: string,
  params: ListRegulationVersionsParams = {},
): Promise<RegulationVersionListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/regulations/${regulationId}/versions${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "改正履歴の取得に失敗しました。");
  }

  return regulationVersionListResponseSchema.parse(await response.json());
}

/** GET /api/v1/regulations/:id/diff?from=&to=（S07 改正差分）。 */
export async function getRegulationDiff(
  accessToken: string,
  regulationId: string,
  from: number,
  to: number,
): Promise<RegulationDiffResponse> {
  const query = new URLSearchParams({ from: String(from), to: String(to) });

  const response = await fetch(`${API_BASE_URL}/regulations/${regulationId}/diff?${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "改正差分の取得に失敗しました。");
  }

  return regulationDiffResponseSchema.parse(await response.json());
}
