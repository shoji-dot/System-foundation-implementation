-- S03（オンボーディング: 職能・関心国選択）として users に profession / interested_jurisdictions /
-- onboarding_completed_at を追加する（設計書④ users 準拠、設計書⑦ 職能属性、設計書⑬ 画面遷移
-- S01-S02-S03-S04 準拠、ユーザー承認済み）。
-- interested_jurisdictions は user_projects.target_jurisdictions と同様、配列カラムで直接保持する。

-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('REGULATORY', 'QA', 'SAFETY', 'SALES', 'DESIGN', 'MEDICAL', 'ACADEMIC');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "profession" "Profession",
  ADD COLUMN "interested_jurisdictions" "JurisdictionCode"[] NOT NULL DEFAULT ARRAY[]::"JurisdictionCode"[],
  ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);
