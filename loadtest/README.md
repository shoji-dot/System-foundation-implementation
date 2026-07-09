# 負荷テスト (k6)

Phase 6「負荷/セキュリティテスト」向け。小規模B2B想定(同時20ユーザー程度、p95<500ms)でauthおよび主要read APIのレイテンシ・エラー率を検証する。

## 内容

- `read_flow`: 0→20VUへランプアップし2分維持。ログイン後の通常利用を模擬し、`GET /me` `/projects` `/regulations` `/search` `/notifications` `/courses` を一巡する。
- `auth_flow`: `POST /auth/login` のレイテンシのみを低頻度(4回/分)で計測する別シナリオ。ログインのレート制限(10回/分)を超えないよう意図的に低頻度にしている。
- テスト用アカウントは `setup()` で1件だけ作成し(既存アカウントを使う場合は環境変数で指定可)、全VU・全イテレーションで使い回す。毎回signupすると本番DBにゴミアカウントが増え続けるため、この設計にしている。

## 事前準備 (Windows / PowerShell)

k6本体のインストール(いずれか一度だけ):

```powershell
winget install k6.k6
```

Dockerを使う場合はインストール不要(下記「Dockerで実行」参照)。

## 実行方法 (PowerShell、コピペ用)

### ローカル環境(docker-compose起動中のapp)に対して

```powershell
$env:BASE_URL = "http://localhost:3001/api/v1"
k6 run loadtest/k6-load-test.js
```

### Railway本番環境に対して

**注意:** 本番DBに `k6-loadtest-*@example.com` というテストユーザーが1件作成されます。実行後、必要なら管理画面等から削除してください。

```powershell
$env:BASE_URL = "https://system-foundation-implementation-production.up.railway.app/api/v1"
k6 run loadtest/k6-load-test.js
```

### 既存のテスト専用アカウントを使い回す場合(推奨・本番向け)

事前に一度だけ本番でテスト用アカウントをsignupしておき、以後はそれを指定する(実行の度に新規アカウントが増えない):

```powershell
$env:BASE_URL = "https://system-foundation-implementation-production.up.railway.app/api/v1"
$env:TEST_USER_EMAIL = "k6-loadtest@example.com"
$env:TEST_USER_PASSWORD = "LoadTest123!"
k6 run loadtest/k6-load-test.js
```

### Dockerで実行する場合(k6未インストールでも可)

```powershell
docker run --rm -i -e BASE_URL="http://host.docker.internal:3001/api/v1" grafana/k6 run - < loadtest/k6-load-test.js
```

## 結果の見方

実行後、コンソールに `thresholds` の結果が✓/✗で表示される。

- `http_req_duration{scenario:read_flow} p(95)<500`: read系APIの95パーセンタイルが500ms未満か
- `http_req_duration{scenario:auth_flow} p(95)<800`: ログインAPIの95パーセンタイルが800ms未満か(bcryptjs比較を含むため read系より緩め)
- `http_req_failed rate<0.01`: 全リクエストの失敗率1%未満
- `login_failed` / `read_failed`: シナリオ別の失敗率1%未満

いずれかが✗(赤字)の場合、該当APIのレスポンスタイム・DB/Redis接続・Railwayのリソース(CPU/メモリ)を確認する。

## 想定負荷プロファイルについて

設計書に具体的な負荷目標の数値記載がないため、ユーザー承認のうえ「小規模B2B想定(同時20VU、p95<500ms)」を採用した(2026-07-08)。将来的に利用企業数が急増する見込みが立った場合は、`options.scenarios.read_flow.stages` のtarget値を引き上げて再実行する。
