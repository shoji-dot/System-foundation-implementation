import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, StaleWhileRevalidate } from "serwist";

// `injectionPoint`（デフォルト "self.__SW_MANIFEST"）をTypeScriptに認識させるための宣言。
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * PWA Service Worker（設計書②⑫「アプリシェル+閲覧済み法令のオフラインキャッシュ（Stale-While-Revalidate）」準拠）。
 * 法令詳細ページ・APIは一度閲覧すればオフラインでも再表示できるよう、defaultCacheより手前で
 * StaleWhileRevalidate戦略を明示的に適用する（先勝ちでマッチするため順序が重要）。
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        (url.pathname.startsWith("/api/v1/regulations") || url.pathname.startsWith("/regulations")),
      handler: new StaleWhileRevalidate({ cacheName: "viewed-regulations" }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
