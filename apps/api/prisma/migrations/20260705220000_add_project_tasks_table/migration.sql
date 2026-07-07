-- Phase 5: 実務支援（設計書④⑫ S16 チェックリスト・タスク・期限準拠）
-- project_tasks を追加する。
-- 設計書は checklist_item_ref で checklists マスタ（届出/認証/承認等の審査項目内容）を参照する構造だが、
-- チェックリストの実内容は薬事の専門知識を要し、AIによる推測実装は誤った規制情報を生むリスクがあるため、
-- 今回は checklists マスタを作らずユーザー自由入力のタスク管理とする（ユーザー承認済み）。
-- title を表示用ラベルとして追加し、checklist_item_ref は将来 checklists マスタ連携用に nullable で予約する。

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "project_tasks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "checklist_item_ref" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "due_date" DATE,
    "assignee" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_tasks_project_id_idx" ON "project_tasks"("project_id");

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "user_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
