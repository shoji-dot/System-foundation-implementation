import type { CreateSubscriptionRequest, SubscriptionResponse } from "@yakuji/shared";
import { subscriptionResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * S18（通知設定）向けAPIクライアント（設計書⑤ POST /api/v1/subscriptions）。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class SubscriptionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** POST /api/v1/subscriptions（設計書⑤、S18「購読国・タイプ・頻度」）。 */
export async function createSubscription(
  accessToken: string,
  request: CreateSubscriptionRequest,
): Promise<SubscriptionResponse> {
  const response = await fetch(`${API_BASE_URL}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new SubscriptionApiError(
      problem?.detail ?? "購読設定の保存に失敗しました。",
      response.status,
    );
  }

  return subscriptionResponseSchema.parse(await response.json());
}
