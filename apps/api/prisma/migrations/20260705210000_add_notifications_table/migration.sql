-- Phase 4: 公開時のアプリ内通知生成（設計書⑨「published時: 購読ユーザーへ通知（アプリ内+メール）」準拠、S17）
-- notifications テーブルを追加する（設計書④に列定義が無いためユーザー承認済み）。
-- メール配信は保留中のためアプリ内通知のみ。既読切替APIは今回のスコープ外だが is_read 列は先行して保持する。

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "regulation_version_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_regulation_version_id_fkey" FOREIGN KEY ("regulation_version_id") REFERENCES "regulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
