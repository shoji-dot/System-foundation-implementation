# Vercel セットアップ手順（Phase 0）

## 手順

1. Vercel で New Project → GitHub リポジトリを Import する。
2. **Root Directory** を `apps/web` に設定する（Edit → apps/web を選択）。
   - `apps/web/vercel.json` により install/build コマンドはモノレポルートから
     `pnpm install` → `pnpm turbo run build --filter=@yakuji/web` を実行する。
   - `ignoreCommand` に `turbo-ignore` を設定し、`apps/web` に影響のない変更では
     ビルドをスキップする。
3. Framework Preset: **Next.js** （自動検出される）
4. Node.js Version: **22.x** を選択する（Project Settings → Build & Deployment）。
5. Environment Variables に `apps/web/.env.example` を参照して以下を設定する。
   - `NEXT_PUBLIC_API_BASE_URL`: Railway api サービスの公開URL（例:
     `https://<railway-api-domain>/api/v1`）
6. Git Integration:
   - **Production Branch**: `main`
   - `develop` ブランチおよび Pull Request は自動的に **Preview Deployment** となる
     （Vercel既定動作、追加設定不要）。
7. push すると自動でビルド・デプロイされる（Production: main / Preview: develop, PR）。

## 動作確認

デプロイ後、以下にアクセスして 200 OK と JSON が返ることを確認する。

```
GET https://<vercel-domain>/
GET https://<vercel-domain>/api/health
```
