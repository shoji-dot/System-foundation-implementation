import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// PWA対応（設計書②⑫「next-pwa 相当の Service Worker」準拠）。
// next-pwaは開発終了しているため、Next.js公式が後継として案内するSerwist（@serwist/next）を採用（機能同等）。
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // 開発時はSWのキャッシュが邪魔になりやすいため本番ビルドのみ有効化する。
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
};

export default withSerwist(nextConfig);
