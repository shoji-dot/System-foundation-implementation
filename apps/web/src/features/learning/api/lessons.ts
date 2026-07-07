import type { LessonDetailResponse, LessonListResponse } from "@yakuji/shared";
import { lessonDetailResponseSchema, lessonListResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * レッスン（設計書⑤ GET /api/v1/lessons、/lessons/:id、S11「レッスン」）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class LessonApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new LessonApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListLessonsParams {
  courseId?: string;
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/lessons?courseId=（S10のコース詳細に表示するレッスン一覧）。 */
export async function listLessons(
  accessToken: string,
  params: ListLessonsParams = {},
): Promise<LessonListResponse> {
  const query = new URLSearchParams();
  if (params.courseId) {
    query.set("courseId", params.courseId);
  }
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(`${API_BASE_URL}/lessons${queryString ? `?${queryString}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "レッスン一覧の取得に失敗しました。");
  }

  return lessonListResponseSchema.parse(await response.json());
}

/** GET /api/v1/lessons/:id（S11 本文表示）。 */
export async function getLessonDetail(
  accessToken: string,
  lessonId: string,
): Promise<LessonDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "レッスン詳細の取得に失敗しました。");
  }

  return lessonDetailResponseSchema.parse(await response.json());
}
