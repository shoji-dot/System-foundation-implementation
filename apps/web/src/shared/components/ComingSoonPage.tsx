interface ComingSoonPageProps {
  title: string;
  description: string;
}

/**
 * フロントエンド未実装の画面向け準備中プレースホルダー（グローバルナビの5項目固定に対応するため必要）。
 * 対応するバックエンドAPIが既に存在する場合でも、フロントエンドUI実装までは本コンポーネントを表示する。
 */
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 p-8">
      <h1 className="text-2xl font-semibold text-text">{title}</h1>
      <p className="text-[14px] text-text-secondary">{description}</p>
      <p className="rounded-lg bg-surface p-4 text-[14px] text-text-secondary">
        準備中です。近日公開予定です。
      </p>
    </main>
  );
}
