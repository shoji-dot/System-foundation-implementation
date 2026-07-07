-- 今回のS16作業とは無関係の既存ドリフト修正。
-- user_projects.target_jurisdictions は元のマイグレーション(20260705080000_add_user_projects)手書きSQLで
-- DEFAULT ARRAY[]::"JurisdictionCode"[] を付与していたが、schema.prisma側のtargetJurisdictions列には
-- @default([]) を宣言していなかったため、schema/DB間にドリフトが生じていた。
-- 今回 `prisma migrate dev` 実行時にPrismaが自動検出・修正したもの（DBのDEFAULTをschema.prismaに合わせて削除）。

-- AlterTable
ALTER TABLE "user_projects" ALTER COLUMN "target_jurisdictions" DROP DEFAULT;
