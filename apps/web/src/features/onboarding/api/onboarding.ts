import type { CompleteOnboardingRequest, UserResponse } from "@yakuji/shared";
import { userResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * S03（オンボーディング: 職能・関心国選択）向けAPIクライアント（PATCH /api/v1/me/onboarding）。
 * subscriptions.ts等と同様、Reactに依存しない純粋関数として実装する。
 */
export class OnboardingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function completeOnboarding(
  accessToken: string,
  request: CompleteOnboardingRequest,
): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/me/onboarding`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new OnboardingApiError(problem?.detail ?? "登録に失敗しました。", response.status);
  }

  return userResponseSchema.parse(await response.json());
}
