-- Phase 7 (⑦-2 工程マスタ): 設計変更書_ライフサイクル管理_SaaS化.md v1.0 ② DB変更 のうち
-- 工程マスタ3テーブル（lifecycle_phases / lifecycle_templates / lifecycle_template_steps）を追加する。
-- ProjectRoadmap/ProjectRoadmapStep（プロジェクトへの適用・進捗管理）は7-3着手時に別マイグレーションで
-- 追加する（ユーザー承認済み、未使用テーブルを先行して作らない方針）。
-- 本マイグレーションはスキーマ追加のみで、API/管理画面/初期マスタデータ投入は含まない
-- （billing foundation migration (20260709120000) と同方針）。
-- 既存テーブルへの破壊的変更なし。

-- CreateEnum
CREATE TYPE "LifecyclePhaseCode" AS ENUM ('PLANNING', 'MARKET_RESEARCH', 'DESIGN', 'RISK_ISO14971', 'QMS', 'TESTING', 'REG_STRATEGY', 'SUBMISSION', 'PMDA_CONSULT', 'APPROVAL', 'REIMBURSEMENT', 'LAUNCH', 'SALES', 'CHANGE_CONTROL', 'COMPLAINT', 'CAPA', 'RECALL', 'DISCONTINUATION');

-- CreateEnum
CREATE TYPE "LifecycleDeviceCategory" AS ENUM ('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IV', 'SAMD', 'IVD', 'ACTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "LifecycleTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "lifecycle_phases" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "code" "LifecyclePhaseCode" NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifecycle_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "jurisdiction_id" UUID NOT NULL,
    "device_category" "LifecycleDeviceCategory" NOT NULL,
    "procedure_type" TEXT NOT NULL,
    "status" "LifecycleTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifecycle_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_template_steps" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "template_id" UUID NOT NULL,
    "phase_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration_min_days" INTEGER,
    "duration_max_days" INTEGER,
    "cost_min_jpy" INTEGER,
    "cost_max_jpy" INTEGER,
    "required_documents" JSONB NOT NULL,
    "required_tests" JSONB NOT NULL,
    "related_regulation_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pmda_resource_urls" JSONB NOT NULL,
    "notes" TEXT,
    "source_refs" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifecycle_template_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lifecycle_phases_code_key" ON "lifecycle_phases"("code");

-- CreateIndex
CREATE INDEX "lifecycle_templates_filter_idx" ON "lifecycle_templates"("jurisdiction_id", "device_category", "procedure_type", "status");

-- CreateIndex
CREATE INDEX "lifecycle_template_steps_template_id_idx" ON "lifecycle_template_steps"("template_id");

-- CreateIndex
CREATE INDEX "lifecycle_template_steps_phase_id_idx" ON "lifecycle_template_steps"("phase_id");

-- AddForeignKey
ALTER TABLE "lifecycle_templates" ADD CONSTRAINT "lifecycle_templates_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_template_steps" ADD CONSTRAINT "lifecycle_template_steps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "lifecycle_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_template_steps" ADD CONSTRAINT "lifecycle_template_steps_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "lifecycle_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
