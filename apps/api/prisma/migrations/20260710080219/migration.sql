-- `prisma migrate dev`が前migration(20260710150000)適用直後に検出したschema.prisma-DB間の
-- 小さな乖離を自動生成・自動修正したもの（サンドボックスではprisma generate/migrate devが
-- ネットワーク制約で実行できず、手書きmigration.sqlのみでは検出できなかった差分）。
-- 1. lifecycle_template_steps.related_regulation_ids: PR①(7-2)時点のmigration.sqlが
--    DEFAULT ARRAY[]::TEXT[] を付与していたが、schema.prisma側は@default([])を宣言しておらず
--    (既存のuser_projects.target_jurisdictions等と同じ「配列は明示的に渡す」方針と統一するため)、
--    今回初めて検出・解消された前from由来の乖離（本タクソノミー再設計とは無関係）。
-- 2. lifecycle_templates.framework: 前migration(20260710150000)がDB列のDEFAULTを明示的に
--    DROPしていたが、schema.prisma側は@default(MEDICAL_DEVICE)を宣言したままだったため
--    （既存のstatus @default(DRAFT)等、enum列にデフォルトを持たせる本コードベースの慣習と
--    整合させる方が自然と判断）、DB側にデフォルトを再度SETして一致させた。
-- AlterTable
ALTER TABLE "lifecycle_template_steps" ALTER COLUMN "related_regulation_ids" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lifecycle_templates" ALTER COLUMN "framework" SET DEFAULT 'MEDICAL_DEVICE';
