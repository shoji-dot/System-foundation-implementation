# 工程マスタ初期データ投入（Phase7 7-2）

`docs/ドラフト_工程マスタ初期データ_JP.md` v0.2（2026-07-10承認）をJSON化したもの。ローカル開発環境（develop ブランチ）のadmin APIに9件POSTする。

## 前提

- ローカルで `apps/api` が起動していること（develop ブランチ、`pnpm --filter @yakuji/api dev` 等）
- ADMINまたはEDITORロールのログイン用メールアドレス・パスワードを保有していること

## 実行手順（PowerShell）

```powershell
cd scripts\lifecycle-seed
$env:API_BASE="http://localhost:3001/api/v1"
$env:ADMIN_EMAIL="<your-admin-email>"
$env:ADMIN_PASSWORD="<your-admin-password>"
node ingest-lifecycle-templates.mjs .\lifecycle-templates.json
```

## 動作

1. ログインしてアクセストークン取得
2. 既存の工程マスタ一覧を取得し、同一条件（jurisdiction/framework/deviceClass/productNovelty/approvalRoute/characteristics）のテンプレートが既にあればスキップ（重複投入防止）
3. 未投入の9テンプレートをPOST `/admin/lifecycle-templates`（作成時は必ず status=DRAFT）
4. 結果サマリ（作成/スキップ/失敗件数）を表示

publishは行わない。投入後はS22管理画面（`/admin/lifecycle-templates`）で内容を目視確認のうえ、個別にpublishすること（完了基準: published 8本以上）。

## 既知の要確認事項（草案 6章より、投入後の追加検討事項）

- ②クラスII認証費用（40〜90万円）は民間サイト出典。代表的な登録認証機関へ個別確認し置換を推奨。
- PMDA_CONSULT費用は相談区分ごとに異なるためnull+PDFリンクのみ。
- ⑧IVDコンパニオン診断薬、⑨能動植込み改良品の派生テンプレートは今回スコープ外（将来追加）。
- effectiveFrom暫定値（2022-05-20）は承認申請手数料の最終改定日。最新確認を別途推奨。
