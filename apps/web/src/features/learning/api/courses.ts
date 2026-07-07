import type { CourseDetailResponse, CourseListResponse } from "@yakuji/shared";
import { courseDetailResponseSchema, courseListResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 学習コース（設計書⑤ GET /api/v1/courses、S10「学習コース一覧」）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class CourseApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new CourseApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListCoursesParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/courses（S10 一覧、order順の体系カリキュラム表示、絞り込み条件は持たない）。 */
export async function listCourses(
  accessToken: string,
  params: ListCoursesParams = {},
): Promise<CourseListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(`${API_BASE_URL}/courses${queryString ? `?${queryString}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "学習コース一覧の取得に失敗しました。");
  }

  return courseListResponseSchema.parse(await response.json());
}

/** GET /api/v1/courses/:id（S10 コース詳細、レッスン一覧画面のコース名表示用）。 */
export async function getCourseDetail(
  accessToken: string,
  courseId: string,
): Promise<CourseDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "学習コース詳細の取得に失敗しました。");
  }

  return courseDetailResponseSchema.parse(await response.json());
}
