import type { Plan, SystemRole } from "@yakuji/shared";
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/**
 * Auth.js の型を拡張し、NestJS側のJWT(設計書⑦)由来の情報をセッション/トークンに持たせる。
 */
declare module "next-auth" {
  interface User {
    id: string;
    locale: string;
    systemRole: SystemRole;
    plan: Plan;
    /** S03オンボーディング未完了ユーザーは null（設計書⑫、S04等へのリダイレクトゲートに使用）。 */
    onboardingCompletedAt: string | null;
    /** NestJS access token（設計書⑦、15分）。 */
    accessToken: string;
    /** NestJS refresh token（設計書⑦、30日）。jwtコールバック内でのみ使用しクライアントへは渡さない。 */
    refreshToken: string;
    accessTokenExpiresAt: number;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      locale: string;
      systemRole: SystemRole;
      plan: Plan;
      onboardingCompletedAt: string | null;
    };
    accessToken: string;
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    locale: string;
    systemRole: SystemRole;
    plan: Plan;
    onboardingCompletedAt: string | null;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    error?: "RefreshAccessTokenError";
  }
}
