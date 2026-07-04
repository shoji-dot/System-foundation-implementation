-- Phase 1: JMDN検索（設計書 ④ 準拠）
-- device_classifications / classification_mappings を追加する。

-- CreateEnum
CREATE TYPE "ClassificationScheme" AS ENUM ('JMDN', 'FDA_PRODUCT_CODE', 'EMDN', 'GMDN');

-- CreateTable
CREATE TABLE "device_classifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "jurisdiction_id" UUID NOT NULL,
    "scheme" "ClassificationScheme" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" TEXT,
    "definition" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_mappings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "from_id" UUID NOT NULL,
    "to_id" UUID NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_classifications_scheme_code_idx" ON "device_classifications"("scheme", "code");

-- CreateIndex
CREATE UNIQUE INDEX "device_classifications_jurisdiction_id_scheme_code_key" ON "device_classifications"("jurisdiction_id", "scheme", "code");

-- CreateIndex
CREATE UNIQUE INDEX "classification_mappings_from_id_to_id_key" ON "classification_mappings"("from_id", "to_id");

-- AddForeignKey
ALTER TABLE "device_classifications" ADD CONSTRAINT "device_classifications_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_mappings" ADD CONSTRAINT "classification_mappings_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "device_classifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_mappings" ADD CONSTRAINT "classification_mappings_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "device_classifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
