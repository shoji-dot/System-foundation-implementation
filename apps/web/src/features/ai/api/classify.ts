import type { AiClassifyRequest, AiClassifyResponse } from "@yakuji/shared";
import { aiClassifyResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 分類支援（設計書⑤⑥ POST /api/v1/ai/classify「機器概要→候補分類提示」）向けAPIクライアント。
 * classifyは1往復のJSON応答のためSSEパースは不要（streamChatとは異なりclassifyDeviceの返り値をそのまま使える）。
 */
export class ClassifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** POST /api/v1/ai/classify。 */
export async function classifyDevice(
  accessToken: string,
  request: AiClassifyRequest,
): Promise<AiClassifyResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/classify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new ClassifyApiError(problem?.detail ?? "分類候補の取得に失敗しました。", response.status);
  }

  return aiClassifyResponseSchema.parse(await response.json());
}
