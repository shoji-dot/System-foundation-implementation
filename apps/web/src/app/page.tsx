import Link from "next/link";

/** 設計書⑫ S01（ランディング）: 価値提案・登録導線。 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-text">医療機器薬事承認支援アプリ</h1>
      <p className="max-w-md text-center text-text-secondary">
        医療機器の薬事承認業務を、法規制の検索・学習・実務支援で一気通貫にサポートします。
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-accent px-4 text-[16px] font-medium text-white"
        >
          新規登録
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          ログイン
        </Link>
      </div>
    </main>
  );
}
