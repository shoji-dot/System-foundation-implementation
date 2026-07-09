import type {
  CreateTagRequest,
  TagListResponse,
  TagResponse,
  UpdateTagRequest,
} from "@yakuji/shared";
import { tagListResponseSchema, tagResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちタグ管理向けAPIクライアント（ADMIN/EDITOR限定、設計書⑦ RBAC）。
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す、admin-users.tsと同方針）。
 */
export class AdminTagsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new AdminTagsApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListTagsParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/admin/tags（タグ一覧、ADMIN/EDITOR限定）。 */
export async function listTags(
  accessToken: string,
  params: ListTagsParams = {},
): Promise<TagListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/admin/tags${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "タグ一覧の取得に失敗しました。");
  }

  return tagListResponseSchema.parse(await response.json());
}

/** POST /api/v1/admin/tags（タグ作成、ADMIN/EDITOR限定）。 */
export async function createTag(accessToken: string, body: CreateTagRequest): Promise<TagResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/tags`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "タグの作成に失敗しました。");
  }

  return tagResponseSchema.parse(await response.json());
}

/** PATCH /api/v1/admin/tags/:id（タグ更新、ADMIN/EDITOR限定）。 */
export async function updateTag(
  accessToken: string,
  tagId: string,
  body: UpdateTagRequest,
): Promise<TagResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/tags/${tagId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "タグの更新に失敗しました。");
  }

  return tagResponseSchema.parse(await response.json());
}

/** DELETE /api/v1/admin/tags/:id（タグ削除、ADMIN/EDITOR限定）。 */
export async function deleteTag(accessToken: string, tagId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/tags/${tagId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "タグの削除に失敗しました。");
  }
}
