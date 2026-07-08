import type { MyOrganizationsResponse, UpdateProfileRequest, UserResponse } from "@yakuji/shared";
import { myOrganizationsResponseSchema, userResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * S19（アカウント設定: プロフィール・組織）向けAPIクライアント（設計書⑤に明記は無いが
 * PATCH /api/v1/me/profile・GET /api/v1/me/organizations はユーザー承認済みで追加、⑫ S19）。
 * subscriptions.ts等と同様、Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class AccountApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** GET /api/v1/me（設計書⑤）。S19プロフィール編集フォームの初期値取得に使用する。 */
export async function getCurrentUser(accessToken: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new AccountApiError(
      problem?.detail ?? "プロフィールの取得に失敗しました。",
      response.status,
    );
  }

  return userResponseSchema.parse(await response.json());
}

/** PATCH /api/v1/me/profile（S19「プロフィール」編集）。 */
export async function updateProfile(
  accessToken: string,
  request: UpdateProfileRequest,
): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/me/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new AccountApiError(
      problem?.detail ?? "プロフィールの更新に失敗しました。",
      response.status,
    );
  }

  return userResponseSchema.parse(await response.json());
}

/** GET /api/v1/me/organizations（S19「組織」表示。作成・招待・メンバー管理は対象外）。 */
export async function listMyOrganizations(accessToken: string): Promise<MyOrganizationsResponse> {
  const response = await fetch(`${API_BASE_URL}/me/organizations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new AccountApiError(problem?.detail ?? "組織情報の取得に失敗しました。", response.status);
  }

  return myOrganizationsResponseSchema.parse(await response.json());
}
