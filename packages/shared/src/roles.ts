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
