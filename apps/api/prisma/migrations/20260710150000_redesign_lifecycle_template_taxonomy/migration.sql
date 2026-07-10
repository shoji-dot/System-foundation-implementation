-- Phase 7 (⑦-2 工程マスタ 再設計, 2026-07-10): 初期マスタデータ草案（8テンプレート）の
-- ユーザーレビューで、単一の LifecycleDeviceCategory enum に「Class」「SaMD/IVD/能動」という
-- 異なる軸が混在しており、同じClassでも新医療機器/改良/後発で期間・費用・書類が変わる実態を
-- 表現できないと指摘を受け、ユーザー承認のうえ以下へ再設計する。
-- lifecycle_templates / lifecycle_template_steps ともに投入済みデータは0件（初期マスタデータは
-- まだレビュー段階でAPI投入前）のため、データ移行は不要でENUM・列の入れ替えのみで完結する。
--
-- 変更内容:
--   1. LifecycleDeviceCategory を廃止し、LifecycleFramework（medical device/IVD/combination product）
--      ・LifecycleDeviceClass（Class I-IV/OTHER、nullable）・LifecycleProductNovelty（新/改良/後発、nullable）
--      の3軸に分離する。
--   2. procedure_type 列を approval_route へ改称する（列の意味・自由文字列という設計は変更なし）。
--   3. effective_from（NOT NULL）・effective_to（nullable）を追加する（regulation_versionsと同型、
--      「このテンプレートの期間・費用データが妥当と確認できた実世界の期間」の監査用）。
--   4. TaggableType に LIFECYCLE_TEMPLATE を追加する（SaMD/能動植込み等の「特性」をenum固定化せず
--      既存tags/taggingsで表現するため）。

-- CreateEnum
CREATE TYPE "LifecycleFramework" AS ENUM ('MEDICAL_DEVICE', 'IVD', 'COMBINATION_PRODUCT');

-- CreateEnum
CREATE TYPE "LifecycleDeviceClass" AS ENUM ('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IV', 'OTHER');

-- CreateEnum
CREATE TYPE "LifecycleProductNovelty" AS ENUM ('NEW', 'MODIFIED', 'GENERIC');

-- AlterEnum（既存のTaggableType値LESSONは維持したまま追加、投入済みデータへの影響なし）
ALTER TYPE "TaggableType" ADD VALUE 'LIFECYCLE_TEMPLATE';

-- DropIndex（列名が変わるためdevice_categoryを含む旧filter idxを一旦削除）
DROP INDEX "lifecycle_templates_filter_idx";

-- AlterTable: 列追加
ALTER TABLE "lifecycle_templates"
    ADD COLUMN "framework" "LifecycleFramework" NOT NULL DEFAULT 'MEDICAL_DEVICE',
    ADD COLUMN "device_class" "LifecycleDeviceClass",
    ADD COLUMN "product_novelty" "LifecycleProductNovelty",
    ADD COLUMN "effective_from" DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN "effective_to" DATE;

-- AlterTable: 旧device_category列（0件データのため単純DROP、SaMD/IVD/ACTIVEはtags/taggingsへ移行）
ALTER TABLE "lifecycle_templates" DROP COLUMN "device_category";

-- AlterTable: procedure_type → approval_route へ改称
ALTER TABLE "lifecycle_templates" RENAME COLUMN "procedure_type" TO "approval_route";

-- AlterTable: デフォルト値は初期投入の利便のためのみで、以後の新規作成ではアプリ層で必須入力とする
-- （0件時点でのみ使うデフォルトのため、恒久的なデフォルトとしては残さない）
ALTER TABLE "lifecycle_templates" ALTER COLUMN "framework" DROP DEFAULT;
ALTER TABLE "lifecycle_templates" ALTER COLUMN "effective_from" DROP DEFAULT;

-- DropEnum（0件データのため安全に削除可能）
DROP TYPE "LifecycleDeviceCategory";

-- CreateIndex（新しい軸で再作成）
CREATE INDEX "lifecycle_templates_filter_idx" ON "lifecycle_templates"("jurisdiction_id", "framework", "device_class", "approval_route", "status");
