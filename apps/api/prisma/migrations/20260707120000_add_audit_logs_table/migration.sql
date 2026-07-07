-- Phase 6: 商用化（監査ログ）として audit_logs テーブルを追加する（設計書④ audit_logs 準拠）。
-- 設計書の列定義は actor, action, target, at の4項目のみ。target は「対象種別:対象ID」形式の
-- 自由記述とし、種別・IDを分割した列への変更は行わない（設計書を唯一の仕様書として扱うため）。
-- 追記のみで更新・削除を行わない不変のイベント記録のため updated_at は持たない。

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
