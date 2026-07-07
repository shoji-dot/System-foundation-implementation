# 医療機器薬事承認支援アプリ

医療機器の薬事承認（国内外）に関わる法規制情報・一般的名称(JMDN等)検索、学習コンテンツ、
実務支援、AIチャットを提供するアプリケーション。

唯一の仕様書: [`docs/システム全体設計書.md`](./docs/システム全体設計書.md)

> **現在のステータス: Phase 1（MVP）進行中**
> Phase 0（モノレポ・CI/CD・Vercel/Railway接続設定・DBマイグレーション基盤・デザイントークン）完了。
> Phase 1: 認証基盤(⑦)・S02画面 実装済み(PR #2 マージ済み)。次はJP法規制データ閲覧(S06/S07)。

## 技術スタック

| 層             | 技術                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| フロントエンド | Next.js 15 (App Router) / TypeScript strict / Tailwind CSS               |
| バックエンド   | NestJS / TypeScript strict / Clean Architecture                          |
| DB             | PostgreSQL 16 (+ pg_trgm, pgvector) / Prisma                             |
| キュー         | Redis + BullMQ                                                           |
| モノレポ       | pnpm workspace + Turborepo                                               |
| CI/CD          | GitHub Actions（Lint/Typecheck/Test/Build）+ Vercel/Railway 自動デプロイ |

## ディレクトリ構成

```
repo/
├ apps/
│  ├ web/     # Next.js（フロントエンド）
│  └ api/     # NestJS（API + Worker, src/worker）
├ packages/
│  ├ shared/  # Zodスキーマ・型・定数
│  ├ ui/      # デザイントークン
│  └ config/  # eslint / prettier / tsconfig 共有設定
├ docs/       # 設計書・セットアップ手順
└ .github/workflows/
```

## ローカル開発

### 前提

- Node.js 22（`.nvmrc` 参照）
- pnpm 9（`corepack enable && corepack prepare pnpm@9.15.0 --activate`）
- Docker（ローカル PostgreSQL / Redis 用。Railway上のDB/Redisに直接繋ぐ場合は不要）

### 手順

```bash
# 1. ローカル用 PostgreSQL(pgvector) / Redis を起動
docker compose up -d

# 2. 環境変数ファイルを用意
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 3. 依存関係インストール（Husky設定も自動実行される）
pnpm install

# 4. Prisma Client生成 + 初回マイグレーション適用
pnpm --filter @yakuji/api exec prisma generate
pnpm --filter @yakuji/api exec prisma migrate deploy

# 5. 起動（web: :3000 / api: :3001）
pnpm dev
```

### 動作確認

```bash
curl http://localhost:3000/api/health
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/health/db
curl http://localhost:3001/api/v1/health/redis
```

いずれも `{"status":"ok", ...}` が返れば起動確認完了。

### その他コマンド

```bash
pnpm lint        # ESLint（全ワークスペース）
pnpm typecheck    # tsc --noEmit（全ワークスペース）
pnpm test         # Jest（Unit）
pnpm --filter @yakuji/api test:e2e     # NestJS E2E (Postgres/Redis必須)
pnpm --filter @yakuji/web test:e2e     # Playwright E2E
pnpm format       # Prettier --write
```

## デプロイ

- **Vercel**（apps/web）: [`docs/vercel-setup.md`](./docs/vercel-setup.md)
- **Railway**（apps/api: api / worker サービス + PostgreSQL + Redis）:
  [`docs/railway-setup.md`](./docs/railway-setup.md)
- **環境変数一覧**: [`docs/environment-variables.md`](./docs/environment-variables.md)

`main` ブランチへの push で Production、`develop` ブランチ・Pull Requestで
Preview/Staging 環境へ自動デプロイされる。

## Git運用

| ブランチ       | 用途                           |
| -------------- | ------------------------------ |
| `main`         | 常にデプロイ可能な本番ブランチ |
| `develop`      | 開発ブランチ                   |
| `feature/xxxx` | 機能追加                       |
| `fix/xxxx`     | バグ修正                       |
| `chore/xxxx`   | 環境整備                       |
| `docs/xxxx`    | ドキュメント                   |

1コミット = 1機能を原則とする。

## ロードマップ

設計書 ⑮ 開発ロードマップ参照。現在 **Phase 0 完了 / Phase 1（認証・JP法規制データ閲覧・
JMDN検索・統合検索基本・PWA）進行中** — 認証基盤(⑦)・S02画面 完了、次はJP法規制データ閲覧(S06/S07)。
