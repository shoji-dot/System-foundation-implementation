-- Phase 7 (⑦-3 ロードマップ): 設計変更書_ライフサイクル管理_SaaS化.md v1.0 ② DB変更のうち
-- ProjectRoadmap/ProjectRoadmapStep（7-2時点で先送りしたプロジェクトへのテンプレート適用・進捗管理）を追加する。
-- 本マイグレーションはスキーマ追加のみで、生成/進捗API・S23-S25画面・S16統合は含まない
-- （lifecycle_template_tables migration (20260710090000) と同方針）。
-- 既存テーブルへの破壊的変更なし。
--
-- RoadmapStatusはACTIVEのみを先行定義する（設計書に値の明記が無く、生成usecase未実装のため
-- GENERATING/FAILED等の要否が未確定。Postgres enumは ALTER TYPE ... ADD VALUE で後方互換に追加できるため、
-- 必要が生じた時点で追加する）。

-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('ACTIVE');

-- CreateEnum
CREATE TYPE "RoadmapStepStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "project_roadmaps" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "ai_adjustments" JSONB,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_roadmap_steps" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "roadmap_id" UUID NOT NULL,
    "template_step_id" UUID NOT NULL,
    "status" "RoadmapStepStatus" NOT NULL DEFAULT 'TODO',
    "planned_start_date" DATE,
    "planned_end_date" DATE,
    "actual_start_date" DATE,
    "actual_end_date" DATE,
    "assignee_id" UUID,
    "custom_fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_roadmap_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_roadmaps_project_id_key" ON "project_roadmaps"("project_id");

-- CreateIndex
CREATE INDEX "project_roadmap_steps_roadmap_id_idx" ON "project_roadmap_steps"("roadmap_id");

-- CreateIndex
CREATE INDEX "project_roadmap_steps_assignee_id_idx" ON "project_roadmap_steps"("assignee_id");

-- AddForeignKey
ALTER TABLE "project_roadmaps" ADD CONSTRAINT "project_roadmaps_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "user_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_roadmaps" ADD CONSTRAINT "project_roadmaps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "lifecycle_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_roadmap_steps" ADD CONSTRAINT "project_roadmap_steps_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "project_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_roadmap_steps" ADD CONSTRAINT "project_roadmap_steps_template_step_id_fkey" FOREIGN KEY ("template_step_id") REFERENCES "lifecycle_template_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_roadmap_steps" ADD CONSTRAINT "project_roadmap_steps_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
