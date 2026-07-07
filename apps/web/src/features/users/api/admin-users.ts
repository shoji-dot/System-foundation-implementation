import type { Plan, SystemRole, UserListResponse, UserResponse } from "@yakuji/shared";
import { userListResponseSchema, userResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 設計書⑫ S21（管理: コンテンツ管理）のうちユーザー管理向けAPIクライアント（ADMIN限定）。
 * S20/監査ログ同様、Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class AdminUsersApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new AdminUsersApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListUsersParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/admin/users（ユーザー一覧、ADMIN限定）。 */
export async function listUsers(
  accessToken: string,
  params: ListUsersParams = {},
): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/admin/users${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "ユーザー一覧の取得に失敗しました。");
  }

  return userListResponseSchema.parse(await response.json());
}

/** PATCH /api/v1/admin/users/:id/role（ロール変更、ADMIN限定）。 */
export async function updateUserRole(
  accessToken: string,
  userId: string,
  systemRole: SystemRole,
): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ systemRole }),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "ロールの変更に失敗しました。");
  }

  return userResponseSchema.parse(await response.json());
}

/** PATCH /api/v1/admin/users/:id/plan（プラン変更、ADMIN限定）。 */
export async function updateUserPlan(
  accessToken: string,
  userId: string,
  plan: Plan,
): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/plan`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "プランの変更に失敗しました。");
  }

  return userResponseSchema.parse(await response.json());
}
