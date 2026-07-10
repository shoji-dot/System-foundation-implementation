import type {
  CheckoutSessionResponse,
  CreateCheckoutSessionRequest,
  CreatePortalSessionRequest,
  PortalSessionResponse,
} from "@yakuji/shared";
import { checkoutSessionResponseSchema, portalSessionResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * S27（プラン/請求）向けAPIクライアント（設計変更書③ POST /billing/checkout・POST /billing/portal）。
 * account.ts等と同様、Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class BillingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** POST /api/v1/billing/checkout。成功時はStripe Checkoutのurlを返す（フロントはリダイレクトのみ）。 */
export async function createCheckoutSession(
  accessToken: string,
  request: CreateCheckoutSessionRequest,
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new BillingApiError(
      problem?.detail ?? "アップグレード手続きの開始に失敗しました。",
      response.status,
    );
  }

  return checkoutSessionResponseSchema.parse(await response.json());
}

/** POST /api/v1/billing/portal。成功時はStripe Customer Portalのurlを返す（フロントはリダイレクトのみ）。 */
export async function createPortalSession(
  accessToken: string,
  request: CreatePortalSessionRequest,
): Promise<PortalSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/billing/portal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new BillingApiError(
      problem?.detail ?? "請求管理画面を開けませんでした。",
      response.status,
    );
  }

  return portalSessionResponseSchema.parse(await response.json());
}
