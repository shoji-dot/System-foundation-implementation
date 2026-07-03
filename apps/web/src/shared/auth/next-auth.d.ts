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
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    error?: "RefreshAccessTokenError";
  }
}
