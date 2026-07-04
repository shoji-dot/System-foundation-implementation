import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "オフライン",
};

/**
 * Service Worker のnavigationフォールバック先（設計書②⑫ PWA準拠）。
 * キャッシュ未取得のページへオフライン時にアクセスした場合にのみ表示される。
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-text">オフラインです</h1>
      <p className="text-text-secondary">
        インターネット接続を確認してください。一度閲覧した法令ページは、オフラインでも引き続き表示できます。
      </p>
    </main>
  );
}
