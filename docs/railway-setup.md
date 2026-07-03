# Railway セットアップ手順（Phase 0）

設計書 ①③ 準拠: Railway に `api`（NestJS API）と `worker`（Redis/BullMQジョブ処理）の
2サービス + `PostgreSQL` + `Redis` プラグインを構築する。

Railway の Config as Code はサービスごとに1ファイルのみ適用され、
モノレポの Root Directory 設定を継承しないため、サービスごとに設定ファイルパスを
明示的に指定する（本リポジトリでは railway.api.json / railway.worker.json）。

## 手順

1. Railway ダッシュボードで新規 Project を作成し、GitHub リポジトリを接続する（GitHub App 連携）。
2. **PostgreSQL** プラグインを追加する（テンプレートは pgvector 拡張が有効なものを選択。
   標準の Railway Postgres イメージに pgvector が含まれない場合は
   `pgvector/pgvector` ベースの Postgres テンプレートに差し替える）。
3. **Redis** プラグインを追加する。
4. **api サービス** を追加:
   - Source: 同一 GitHub リポジトリ
   - Settings → Config File Path: `railway.api.json`
   - Variables: `.env.example`（apps/api）を参照して設定（`DATABASE_URL` / `REDIS_URL` は
     Postgres/Redis プラグインの参照変数 `${{Postgres.DATABASE_URL}}` 等を利用）
5. **worker サービス** を追加:
   - Source: 同一 GitHub リポジトリ（api と同じリポジトリを再利用）
   - Settings → Config File Path: `railway.worker.json`
   - Variables: api サービスと同様
6. 各サービスの Settings → Deploy Triggers で `main` ブランチ = Production、
   `develop` ブランチ = 別環境（Staging）に割り当てる。
7. push すると Dockerfile ビルド → デプロイが自動実行される。

## マイグレーション適用

初回デプロイ後、Railway の api サービスシェル（またはローカルから `DATABASE_URL` を
Railway の値に向けて）で以下を実行する。

```bash
pnpm --filter @yakuji/api exec prisma migrate deploy
```

## ヘルスチェック確認

```bash
curl https://<railway-api-domain>/api/v1/health
curl https://<railway-api-domain>/api/v1/health/db
curl https://<railway-api-domain>/api/v1/health/redis
```
