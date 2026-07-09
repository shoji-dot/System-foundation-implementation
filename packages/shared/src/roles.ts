import { z } from "zod";

/**
 * システムロール（設計書⑦ 準拠）: 運営視点の権限。apps/api の SystemRole と値を一致させる。
 */
export const SYSTEM_ROLES = ["ADMIN", "EDITOR", "USER"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];
export const systemRoleSchema = z.enum(SYSTEM_ROLES);

/**
 * 課金プラン（設計書⑦ 準拠、Phase7 ⑦-1でBUSINESS追加）: apps/api の Plan と値を一致させる。
 */
export const PLANS = ["FREE", "PRO", "BUSINESS", "ENTERPRISE"] as const;
export type Plan = (typeof PLANS)[number];
export const planSchema = z.enum(PLANS);

/**
 * 課金プランの日本語表示名（S19「アカウント設定・プラン」表示用）。PROFESSION_LABELSと同様、
 * 複数画面での再利用に備えDRY原則に基づきここに集約する。課金導線(Stripe)は設計書⑦の通り
 * 未実装のため、S19では表示のみでアップグレードCTAは持たない（ユーザー承認済み）。
 */
export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "フリー",
  PRO: "プロ",
  BUSINESS: "ビジネス",
  ENTERPRISE: "エンタープライズ",
};

/**
 * 職能属性（設計書⑦「職能属性: regulatory / qa / safety / sales / design / medical / academic —
 * 権限ではなく表示パーソナライズに使用（権限モデルを汚さない）」準拠、S03オンボーディングで選択）。
 * apps/api の Profession と値を一致させる。
 */
export const PROFESSIONS = [
  "REGULATORY",
  "QA",
  "SAFETY",
  "SALES",
  "DESIGN",
  "MEDICAL",
  "ACADEMIC",
] as const;
export type Profession = (typeof PROFESSIONS)[number];
export const professionSchema = z.enum(PROFESSIONS);

/**
 * 職能属性の日本語表示名（S03オンボーディング画面で使用。JURISDICTION_LABELSと同様、
 * 複数画面での再利用に備えDRY原則に基づきここに集約する）。
 */
export const PROFESSION_LABELS: Record<Profession, string> = {
  REGULATORY: "薬事(レギュラトリー)",
  QA: "品質保証(QA)",
  SAFETY: "安全性(セーフティ)",
  SALES: "営業・マーケティング",
  DESIGN: "設計・開発",
  MEDICAL: "医療従事者",
  ACADEMIC: "研究・学術",
};
