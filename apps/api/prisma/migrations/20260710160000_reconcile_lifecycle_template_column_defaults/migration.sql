-- `prisma migrate dev`が20260710150000適用直後に検出したschema.prisma-DB間の
-- 小さな乖離を自動生成・自動修正したもの（サンドボックスではprisma generate/migrate devが
-- ネットワーク制約で実行できず、手書きmigration.sqlのみでは検出できなかった差分）。
-- 1. lifecycle_template_steps.related_regulation_ids: PR①(7-2)時点のmigration.sqlが
--    DEFAULT ARRAY[]::TEXT[] を付与していたが、schema.prisma側は@default([])を宣言しておらず
--    (既存のuser_projects.target_jurisdictions等と同じ「配列は明示的に渡す」方針と統一するため)、
--    今回初めて検出・解消された前from由来の乖離（本タクソノミー再設計とは無関係）。
-- 2. lifecycle_templates.framework: 20260710150000がDB列のDEFAULTを明示的に
--    DROPしていたが、schema.prisma側は@default(MEDICAL_DEVICE)を宣言したままだったため
--    （既存のstatus @default(DRAFT)等、enum列にデフォルトを持たせる本コードベースの慣習と
--    整合させる方が自然と判断）、DB側にデフォルトを再度SETして一致させた。
--
-- 【2026-07-10 追記】当初 `prisma migrate dev` が実際に生成したフォルダ名は
-- `20260710080219`（実行時刻ベース、08:02）だったが、これは同日に手書きした
-- `20260710090000_add_lifecycle_template_tables`（09:00, lifecycle_template_steps を
-- CREATE TABLE する）および `20260710150000_redesign_lifecycle_template_taxonomy`
-- （15:00）より辞書順で先に来てしまい、`prisma migrate deploy`で新規DBに最初から
-- 適用する際（CI等）に「relation "lifecycle_template_steps" does not exist」で
-- 失敗することが判明した（ローカル開発DBでは既に両migrationが適用済みの状態で
-- 生成されたため問題が表面化しなかった）。本ファイルはその是正のため、適用順序が
-- 正しくなるようフォルダ名のみを`20260710160000`に変更したもの（SQL内容は変更なし）。
-- AlterTable
ALTER TABLE "lifecycle_template_steps" ALTER COLUMN "related_regulation_ids" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lifecycle_templates" ALTER COLUMN "framework" SET DEFAULT 'MEDICAL_DEVICE';
