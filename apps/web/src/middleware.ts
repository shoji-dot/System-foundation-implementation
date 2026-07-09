import { NextResponse } from "next/server";

import { auth } from "@/shared/auth/auth";

/**
 * S03（オンボーディング）必須ゲート（設計書⑬ 画面遷移 S01-S02-S03-S04、ユーザー承認済み: 必須・スキップ不可）。
 * ログイン済みだがオンボーディング未完了(onboardingCompletedAt===null)のユーザーは、/onboarding以外の
 * ページへアクセスしようとした場合、常に/onboardingへリダイレクトする。
 * 未ログイン時のガード（/loginへのリダイレクト）は各ページのauth()チェックに引き続き委ねる（既存方針を維持）。
 * 利用規約・プライバシーポリシー等の法務ページはオンボーディング状況を問わず常時閲覧できるようEXEMPT_PREFIXESに含める。
 */
const EXEMPT_PREFIXES = [
  "/onboarding",
  "/login",
  "/signup",
  "/api",
  "/terms",
  "/privacy",
  "/ai-policy",
  "/security-policy",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 静的アセット（sw.js, manifest.webmanifest, アイコン等）は拡張子の有無で判定し対象外とする。
  if (pathname.startsWith("/_next") || /\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth;
  if (!session) {
    return NextResponse.next();
  }

  const isExempt = EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isOnboarded = Boolean(session.user.onboardingCompletedAt);

  if (!isOnboarded && !isExempt) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (isOnboarded && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
