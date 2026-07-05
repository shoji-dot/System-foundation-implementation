-- Phase 4: 編集ワークフロー（設計書⑧ draft → review → published 準拠）
-- regulation_versions.status を追加する。
-- Phase1時点(取込パイプライン未実装)の既存行はすべて公開済みデータのため、
-- 後方互換のためデフォルトをPUBLISHEDとする。

-- CreateEnum
CREATE TYPE "RegulationVersionStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED');

-- AlterTable
ALTER TABLE "regulation_versions" ADD COLUMN "status" "RegulationVersionStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateIndex
CREATE INDEX "regulation_versions_regulation_id_status_idx" ON "regulation_versions"("regulation_id", "status");
