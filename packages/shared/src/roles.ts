import { z } from "zod";

/**
 * システムロール（設計書⑦ 準拠）: 運営視点の権限。apps/api の SystemRole と値を一致させる。
 */
export const SYSTEM_ROLES = ["ADMIN", "EDITOR", "USER"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];
export const systemRoleSchema = z.enum(SYSTEM_ROLES);

/**
 * 課金プラン（設計書⑦ 準拠）: apps/api の Plan と値を一致させる。
 */
export const PLANS = ["FREE", "PRO", "ENTERPRISE"] as const;
export type Plan = (typeof PLANS)[number];
export const planSchema = z.enum(PLANS);

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
