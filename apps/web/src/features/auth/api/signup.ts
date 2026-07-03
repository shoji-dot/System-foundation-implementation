import type { SignupRequest, UserResponse } from "@yakuji/shared";
import { signupRequestSchema, userResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

export class SignupError extends Error {}

interface ProblemDetails {
  detail?: string;
}

/**
 * NestJS POST /api/v1/auth/signup を呼び出す（設計書⑤）。
 * signupはアカウント作成のみでAuth.jsのProviderの対象外のため、クライアントから直接NestJSを呼ぶ
 * （login/refreshはAuth.js側でNestJSを仲介する、設計書⑦の役割分担）。
 */
export async function signup(input: SignupRequest): Promise<UserResponse> {
  const payload = signupRequestSchema.parse(input);

  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new SignupError(
      problem?.detail ?? "登録に失敗しました。時間をおいて再度お試しください。",
    );
  }

  return userResponseSchema.parse(await response.json());
}
