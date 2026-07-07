-- Phase 6: 商用化（S21 管理: コンテンツ管理、タグ管理）として tags / taggings テーブルを追加する
-- （設計書④「共通」区分 tags/taggings 準拠）。
-- taggable_type は管理画面から編集可能なlessonのみを今回実装する（regulation/classificationは
-- 編集画面が未実装のため対象外、ユーザー承認済み）。
-- taggable_id は対象種別により参照先テーブルが異なるpolymorphic設計のため、外部キー制約は設定しない。

-- CreateEnum
CREATE TYPE "TaggableType" AS ENUM ('LESSON');

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taggings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "tag_id" UUID NOT NULL,
    "taggable_type" "TaggableType" NOT NULL,
    "taggable_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taggings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "taggings_taggable_type_taggable_id_idx" ON "taggings"("taggable_type", "taggable_id");

-- CreateIndex
CREATE UNIQUE INDEX "taggings_tag_id_taggable_type_taggable_id_key" ON "taggings"("tag_id", "taggable_type", "taggable_id");

-- AddForeignKey
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
