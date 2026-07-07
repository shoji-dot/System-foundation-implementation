-- Phase 5: 実務支援（設計書④⑫ S15/S16準拠、S04「プロジェクト概況」）
-- user_projects を追加する。
-- 設計書のorg_idは必須列だが、signup時にOrganizationが自動作成されないため、
-- 所有者を表すuser_idを追加しorganization_idはnullableとする（ユーザー承認済み）。
-- project_tasks（S16 チェックリスト・タスク・期限）はS16実装時に別途追加する。

-- CreateTable
CREATE TABLE "user_projects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "name" TEXT NOT NULL,
    "device_class" TEXT,
    "target_jurisdictions" "JurisdictionCode"[] NOT NULL DEFAULT ARRAY[]::"JurisdictionCode"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_projects_user_id_idx" ON "user_projects"("user_id");

-- AddForeignKey
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
