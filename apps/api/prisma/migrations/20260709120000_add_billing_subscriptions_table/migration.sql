-- Phase 7 (⑦-1 課金基盤): 設計変更書_ライフサイクル管理_SaaS化.md v1.0（2026-07-09ユーザー承認）に基づき、
-- Plan enum に BUSINESS を追加し、subscriptions テーブルを追加する。
-- source(STRIPE/COMPLIMENTARY) は Stripe を経由しない社内・特別付与プランを表現するためのフラグ
-- （admin による手動付与、設計変更書⑥「社内利用（無償フル機能）」準拠）。
-- 既存テーブルへの破壊的変更なし（Plan enumへの値追加のみ、既存FREE/PRO/ENTERPRISE互換）。
-- 本マイグレーションはスキーマ追加のみで、Stripe Checkout/Portal/Webhook連携ロジックは含まない
-- （billing module実装時の別コミットで追加）。

-- AlterEnum
ALTER TYPE "Plan" ADD VALUE 'BUSINESS';

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('STRIPE', 'COMPLIMENTARY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "plan" "Plan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "SubscriptionSource" NOT NULL DEFAULT 'STRIPE',
    "current_period_end" TIMESTAMP(3),
    "seats" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_idx" ON "subscriptions"("organization_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
