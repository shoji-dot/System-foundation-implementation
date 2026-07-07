import type {
  ClassificationListResponse,
  ClassificationMappingListResponse,
  ClassificationResponse,
  ClassificationScheme,
  JurisdictionCode,
} from "@yakuji/shared";
import {
  classificationListResponseSchema,
  classificationMappingListResponseSchema,
  classificationResponseSchema,
} from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 機器分類（設計書⑤ GET /api/v1/classifications、/classifications/:id、/classifications/:id/mappings、
 * S08「一般的名称/JMDN検索」、S09「分類詳細・各国マッピング」）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class ClassificationApiError extends Error {
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
  throw new ClassificationApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListClassificationsParams {
  scheme?: ClassificationScheme;
  jurisdiction?: JurisdictionCode;
  q?: string;
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/classifications（S08 コード・名称・クラス検索）。 */
export async function listClassifications(
  accessToken: string,
  params: ListClassificationsParams = {},
): Promise<ClassificationListResponse> {
  const query = new URLSearchParams();
  if (params.scheme) {
    query.set("scheme", params.scheme);
  }
  if (params.jurisdiction) {
    query.set("jurisdiction", params.jurisdiction);
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
    `${API_BASE_URL}/classifications${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "機器分類一覧の取得に失敗しました。");
  }

  return classificationListResponseSchema.parse(await response.json());
}

/** GET /api/v1/classifications/:id（S09 詳細）。 */
export async function getClassificationDetail(
  accessToken: string,
  classificationId: string,
): Promise<ClassificationResponse> {
  const response = await fetch(`${API_BASE_URL}/classifications/${classificationId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "機器分類詳細の取得に失敗しました。");
  }

  return classificationResponseSchema.parse(await response.json());
}

/** GET /api/v1/classifications/:id/mappings（S09 各国マッピング）。 */
export async function getClassificationMappings(
  accessToken: string,
  classificationId: string,
): Promise<ClassificationMappingListResponse> {
  const response = await fetch(`${API_BASE_URL}/classifications/${classificationId}/mappings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "各国マッピングの取得に失敗しました。");
  }

  return classificationMappingListResponseSchema.parse(await response.json());
}
