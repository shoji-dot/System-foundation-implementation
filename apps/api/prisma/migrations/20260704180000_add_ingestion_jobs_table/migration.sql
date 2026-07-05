-- Phase 4: 更新基盤（設計書④⑨ 準拠）
-- ingestion_jobs（JP取込パイプラインの実行履歴）を追加する。

-- CreateEnum
CREATE TYPE "IngestionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "ingestion_jobs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "source" TEXT NOT NULL,
    "status" "IngestionJobStatus" NOT NULL DEFAULT 'PENDING',
    "diff_summary" TEXT,
    "error_message" TEXT,
    "run_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingestion_jobs_source_run_at_idx" ON "ingestion_jobs"("source", "run_at");
