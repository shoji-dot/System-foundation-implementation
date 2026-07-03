import { loginRequestSchema, tokenPairResponseSchema, userResponseSchema } from "@yakuji/shared";
import type { NextAuthConfig, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

/**
 * NestJS /api/v1/auth/login を呼び出し、成功したらAuth.jsのUser形状に詰め替える。
 * 設計書⑦の方針: 認証ロジック・パスワード照合はNestJS側が正、Auth.jsはBFF層としてセッション(JWT httpOnly cookie)を管理する。
 */
async function authorizeWithApi(credentials: Partial<Record<string, unknown>>): Promise<User | null> {
  const parsed = loginRequestSchema.safeParse(credentials);
  if (!parsed.success) {
    return null;
  }

  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  if (!loginResponse.ok) {
    return null;
  }
  const tokens = tokenPairResponseSchema.parse(await loginResponse.json());

  const meResponse = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!meResponse.ok) {
    return null;
  }
  const user = userResponseSchema.parse(await meResponse.json());

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    locale: user.locale,
    systemRole: user.systemRole,
    plan: user.plan,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: Date.now() + tokens.expiresIn * 1000,
  };
}

/**
 * NestJS /api/v1/auth/refresh でaccess tokenをローテーション（設計書⑦、apps/api側は失効リストで使用済みトークンを即時失効）。
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
    if (!response.ok) {
      throw new Error(`refresh failed with status ${response.status}`);
    }
    const tokens = tokenPairResponseSchema.parse(await response.json());

    return {
      ...token,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: Date.now() + tokens.expiresIn * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/** access token失効の10秒前から更新扱いにする（ネットワーク遅延・時刻ずれの安全マージン）。 */
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 10_000;

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    // 設計書⑫ S02。フォームUIは別コミットで実装するため、現時点では未作成（次コミットで追加）。
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeWithApi,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          userId: user.id,
          systemRole: user.systemRole,
          plan: user.plan,
          locale: user.locale,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiresAt: user.accessTokenExpiresAt,
        };
      }

      if (Date.now() < token.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_MARGIN_MS) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.systemRole = token.systemRole;
      session.user.plan = token.plan;
      session.user.locale = token.locale;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
} satisfies NextAuthConfig;
