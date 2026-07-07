import type { QuizListResponse } from "@yakuji/shared";
import { quizListResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * クイズ（設計書⑤ GET /api/v1/quizzes?lessonId=、S12「クイズ/結果」）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class QuizApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * GET /api/v1/quizzes?lessonId=。correctChoiceIdも含めて返るAPI仕様のため、
 * 採点はクライアント側（QuizPlayerコンポーネント）で行う。
 */
export async function listQuizzesByLesson(
  accessToken: string,
  lessonId: string,
): Promise<QuizListResponse> {
  const response = await fetch(`${API_BASE_URL}/quizzes?lessonId=${lessonId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new QuizApiError(problem?.detail ?? "クイズの取得に失敗しました。", response.status);
  }

  return quizListResponseSchema.parse(await response.json());
}
