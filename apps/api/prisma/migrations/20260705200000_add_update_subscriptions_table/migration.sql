-- Phase 4: 更新通知（設計書⑤ POST /api/v1/subscriptions、S17/S18 準拠）
-- 購読(update_subscriptions)テーブルを追加する。jurisdiction_id/regulation_typeがNULLの場合は
-- それぞれ「全国」「全タイプ」を意味する（設計書④に列定義が無いため、S18「購読国・タイプ・頻度」の
-- 説明に基づきユーザー承認済みで追加）。

-- CreateEnum
CREATE TYPE "UpdateFrequency" AS ENUM ('REALTIME', 'DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "update_subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "jurisdiction_id" UUID,
    "regulation_type" "RegulationType",
    "frequency" "UpdateFrequency" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "update_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "update_subscriptions_user_id_idx" ON "update_subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "update_subscriptions" ADD CONSTRAINT "update_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_subscriptions" ADD CONSTRAINT "update_subscriptions_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "jurisdictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
