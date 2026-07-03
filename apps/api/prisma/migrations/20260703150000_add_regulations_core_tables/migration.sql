-- Phase 1: JP法規制データ閲覧（設計書 ④⑧ 準拠）
-- jurisdictions / regulations / regulation_versions / regulation_sections / regulation_relations を追加する。

-- CreateEnum
CREATE TYPE "JurisdictionCode" AS ENUM ('JP', 'US', 'EU', 'UK', 'CA', 'AU', 'CN', 'KR', 'TW', 'SG');

-- CreateEnum
CREATE TYPE "RegulationType" AS ENUM ('LAW', 'ORDINANCE', 'NOTICE', 'GUIDANCE', 'STANDARD');

-- CreateEnum
CREATE TYPE "RegulationStatus" AS ENUM ('ACTIVE', 'AMENDED', 'REPEALED');

-- CreateEnum
CREATE TYPE "RegulationRelationType" AS ENUM ('AMENDS', 'IMPLEMENTS', 'REFERS', 'SUPERSEDES');

-- CreateTable
CREATE TABLE "jurisdictions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "code" "JurisdictionCode" NOT NULL,
    "name" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "jurisdiction_id" UUID NOT NULL,
    "type" "RegulationType" NOT NULL,
    "subtype" TEXT,
    "title" TEXT NOT NULL,
    "doc_number" TEXT,
    "status" "RegulationStatus" NOT NULL DEFAULT 'ACTIVE',
    "effective_date" DATE,
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "regulation_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "full_text" TEXT NOT NULL,
    "summary" TEXT,
    "change_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_sections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "version_id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulation_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_relations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "from_id" UUID NOT NULL,
    "to_id" UUID NOT NULL,
    "relation" "RegulationRelationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jurisdictions_code_key" ON "jurisdictions"("code");

-- CreateIndex
CREATE INDEX "regulations_jurisdiction_id_type_status_idx" ON "regulations"("jurisdiction_id", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_versions_regulation_id_version_no_key" ON "regulation_versions"("regulation_id", "version_no");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_sections_version_id_path_key" ON "regulation_sections"("version_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_relations_from_id_to_id_relation_key" ON "regulation_relations"("from_id", "to_id", "relation");

-- AddForeignKey
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_versions" ADD CONSTRAINT "regulation_versions_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_sections" ADD CONSTRAINT "regulation_sections_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "regulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_relations" ADD CONSTRAINT "regulation_relations_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "regulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_relations" ADD CONSTRAINT "regulation_relations_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "regulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
