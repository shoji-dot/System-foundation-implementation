import { z } from "zod";

/**
 * サインアップ要求（設計書⑤ POST /api/v1/auth/signup 準拠）。
 * password の上限72文字は bcrypt の実効上限に合わせた実装上の制約。
 */
export const signupRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。").max(72),
  name: z.string().trim().min(1).max(100),
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

/**
 * 公開可能なユーザー情報（設計書④ users 準拠、passwordHash は含まない）。
 */
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  locale: z.string(),
  systemRole: z.enum(["ADMIN", "EDITOR", "USER"]),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]),
  createdAt: z.string().datetime(),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * ログイン要求（設計書⑤ POST /api/v1/auth/login 準拠）。
 * password はここでは既存パスワードの照合用のため長さ要件を課さない（signupRequestSchema側で制約済み）。
 */
export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * JWTトークンペア応答（設計書⑦: access 15分 + refresh 30日）。
 */
export const tokenPairResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
});
export type TokenPairResponse = z.infer<typeof tokenPairResponseSchema>;
