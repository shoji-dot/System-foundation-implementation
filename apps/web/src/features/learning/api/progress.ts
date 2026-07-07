import type {
  ProgressListResponse,
  ProgressResponse,
  ProgressSummaryResponse,
  RecordProgressRequest,
} from "@yakuji/shared";
import {
  progressListResponseSchema,
  progressResponseSchema,
  progressSummaryResponseSchema,
} from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 学習進捗（GET /api/v1/progress/summary、POST /api/v1/progress、S04「学習進捗」・S11完了操作・S12結果・S13）
 * 向けAPIクライアント。サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class ProgressApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new ProgressApiError(problem?.detail ?? fallbackMessage, response.status);
}

/** GET /api/v1/progress/summary。 */
export async function getLearningProgressSummary(
  accessToken: string,
): Promise<ProgressSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/progress/summary`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "学習進捗の取得に失敗しました。");
  }

  return progressSummaryResponseSchema.parse(await response.json());
}

/**
 * POST /api/v1/progress（S11「レッスンを完了にする」操作、S12クイズ結果送信）。
 * 同一レッスンへの再送信は上書き（冪等）のため、200 OKで返る（バックエンドのコメントと同方針）。
 */
export async function recordProgress(
  accessToken: string,
  request: RecordProgressRequest,
): Promise<ProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/progress`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "学習進捗の記録に失敗しました。");
  }

  return progressResponseSchema.parse(await response.json());
}

export interface ListLearningProgressParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/progress（S13「修了状況・スコア」一覧、レッスン別の進捗をカーソルページネーションで取得）。 */
export async function listLearningProgress(
  accessToken: string,
  params: ListLearningProgressParams = {},
): Promise<ProgressListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/progress${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "学習進捗一覧の取得に失敗しました。");
  }

  return progressListResponseSchema.parse(await response.json());
}
