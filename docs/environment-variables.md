# 環境変数管理（Phase 0）

各アプリの `.env.example` を正としてコピーし、ローカルでは `.env.local`（Next.js）/
`.env`（NestJS）に実値を設定する（いずれも `.gitignore` 対象、コミット禁止）。

## apps/web (Next.js) — `apps/web/.env.example`

| 変数                       | 用途                                                       | ローカル既定値                                                                                                        | 本番 (Vercel)                          |
| -------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | BFFから叩くAPIサーバのベースURL                            | `http://localhost:3001/api/v1`                                                                                        | Railway api サービスの公開URL          |
| `AUTH_SECRET`              | Auth.js (next-auth v5) セッション(JWT)暗号化用シークレット | `npx auth secret` 等で生成した値（未設定だと`next start`で`MissingSecret`エラーになりログイン必須ページが機能しない） | Vercel Environment Variablesに設定済み |

## apps/api (NestJS) — `apps/api/.env.example`

| 変数             | 用途                                                                                                     | ローカル既定値                              | 本番 (Railway)                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`       | 実行環境                                                                                                 | `development`                               | `production`                                                         |
| `PORT`           | APIサーバ待受ポート                                                                                      | `3001`                                      | Railway が自動注入する `PORT` を使用                                 |
| `API_PREFIX`     | APIルートプレフィックス                                                                                  | `api/v1`                                    | 同左                                                                 |
| `CORS_ORIGIN`    | 許可オリジン（カンマ区切り）                                                                             | `http://localhost:3000`                     | VercelのProduction/Previewドメイン                                   |
| `DATABASE_URL`   | PostgreSQL接続文字列                                                                                     | docker-compose の postgres                  | Railway Postgres プラグインの参照変数 `${{Postgres.DATABASE_URL}}`   |
| `REDIS_URL`      | Redis接続文字列                                                                                          | docker-compose の redis                     | Railway Redis プラグインの参照変数 `${{Redis.REDIS_URL}}`            |
| `OPENAI_API_KEY` | AIチャット(S14)埋め込み・生成用（infrastructure/external/llm、ユーザー承認済みでOpenAI一本の構成を採用） | OpenAIダッシュボードで発行した個人/組織キー | Railway Variablesに設定（Secretsとして扱う、コミット・ログ出力禁止） |

## 管理方針

- **ローカル**: `.env` / `.env.local` はコミットしない。`.env.example` のみバージョン管理する。
- **GitHub Actions**: CI の Unit/E2Eテストは `.github/workflows/ci.yml` 内でジョブ専用の
  ダミー値（サービスコンテナ接続情報）を直接指定しており、Secretsは不要。`OPENAI_API_KEY`は
  ユニットテストではfetchをモックするため実キー不要（各specでダミー値を設定）。実際にOpenAI APIを
  呼び出すchat/classifyエンドポイントのE2E検証を追加する段階になったら、GitHub Actions Secretsへの
  追加を検討する。
- **Railway**: サービスの Variables タブで設定。Postgres/Redisプラグインの参照変数
  （`${{Postgres.DATABASE_URL}}` 等）を利用し、値のハードコードを避ける。
- **Vercel**: Project Settings → Environment Variables で Production / Preview /
  Development を分けて設定する。
