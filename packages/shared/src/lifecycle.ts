import { z } from "zod";

import {
  cursorPaginationQuerySchema,
  jurisdictionCodeSchema,
  jurisdictionSummaryResponseSchema,
} from "./schemas";

/**
 * 大工程コード（設計変更書_ライフサイクル管理_SaaS化.md ② DB変更 LifecyclePhase 準拠、Phase7 7-2）。
 * apps/api の LifecyclePhaseCode・Prisma schemaのenum値と一致させる（企画〜販売終了までの18工程）。
 */
export const LIFECYCLE_PHASE_CODES = [
  "PLANNING",
  "MARKET_RESEARCH",
  "DESIGN",
  "RISK_ISO14971",
  "QMS",
  "TESTING",
  "REG_STRATEGY",
  "SUBMISSION",
  "PMDA_CONSULT",
  "APPROVAL",
  "REIMBURSEMENT",
  "LAUNCH",
  "SALES",
  "CHANGE_CONTROL",
  "COMPLAINT",
  "CAPA",
  "RECALL",
  "DISCONTINUATION",
] as const;
export type LifecyclePhaseCode = (typeof LIFECYCLE_PHASE_CODES)[number];
export const lifecyclePhaseCodeSchema = z.enum(LIFECYCLE_PHASE_CODES);

/**
 * 機器種別（設計変更書① S23「クラスI–IV/SaMD/IVD/能動/その他」、② DB変更 deviceCategory 準拠）。
 * 既存の device_classifications（JMDN等、S08/S09）とは別軸の簡易カテゴリで、工程マスタ・
 * ロードマップウィザードのテンプレート選定のみに用いる。
 */
export const LIFECYCLE_DEVICE_CATEGORIES = [
  "CLASS_I",
  "CLASS_II",
  "CLASS_III",
  "CLASS_IV",
  "SAMD",
  "IVD",
  "ACTIVE",
  "OTHER",
] as const;
export type LifecycleDeviceCategory = (typeof LIFECYCLE_DEVICE_CATEGORIES)[number];
export const lifecycleDeviceCategorySchema = z.enum(LIFECYCLE_DEVICE_CATEGORIES);

/** 工程マスタの公開状態（設計変更書②「status(draft/published)」準拠、2状態のみ）。 */
export const LIFECYCLE_TEMPLATE_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type LifecycleTemplateStatus = (typeof LIFECYCLE_TEMPLATE_STATUSES)[number];
export const lifecycleTemplateStatusSchema = z.enum(LIFECYCLE_TEMPLATE_STATUSES);

/**
 * GET /api/v1/lifecycle/templates クエリ（設計変更書③「?jurisdiction=&deviceCategory=&procedureType=」準拠）。
 * procedureTypeはJP/US/EU等で語彙が大きく異なるため自由文字列（apps/api側と同方針）。
 */
export const listLifecycleTemplatesQuerySchema = cursorPaginationQuerySchema.extend({
  jurisdiction: jurisdictionCodeSchema.optional(),
  deviceCategory: lifecycleDeviceCategorySchema.optional(),
  procedureType: z.string().trim().min(1).optional(),
});
export type ListLifecycleTemplatesQuery = z.infer<typeof listLifecycleTemplatesQuerySchema>;

/** GET /api/v1/lifecycle/templates/:id パラメータ。 */
export const lifecycleTemplateIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type LifecycleTemplateIdParam = z.infer<typeof lifecycleTemplateIdParamSchema>;

/** 大工程の要約情報（工程ステップ応答に埋め込む、GET /lifecycle/templates/:id）。 */
export const lifecyclePhaseSummaryResponseSchema = z.object({
  code: lifecyclePhaseCodeSchema,
  name: z.string(),
  order: z.number().int(),
});
export type LifecyclePhaseSummaryResponse = z.infer<typeof lifecyclePhaseSummaryResponseSchema>;

/** 工程マスタの根拠出典（設計変更書④AI設計「根拠必須」準拠）。 */
export const lifecycleTemplateSourceRefResponseSchema = z.object({
  title: z.string(),
  url: z.string(),
});
export type LifecycleTemplateSourceRefResponse = z.infer<
  typeof lifecycleTemplateSourceRefResponseSchema
>;

/**
 * 工程マスタ・個別工程応答（GET /lifecycle/templates/:id、設計変更書② LifecycleTemplateStep 準拠）。
 * duration/cost/requiredDocuments等の実務詳細フィールドは全てnullable: FREEプランでは
 * usecase側で強制的にnullとする（設計変更書⑤「Free制限時は…データ自体は返さない」準拠、
 * フロント制御のみでの出し分けを禁止するため）。id/phase/name/orderは全プラン共通で返す
 * （どの工程が存在するかという骨組みまでは閲覧可能、設計変更書①S23「Free=閲覧のみ」に対応）。
 */
export const lifecycleTemplateStepResponseSchema = z.object({
  id: z.string().uuid(),
  phase: lifecyclePhaseSummaryResponseSchema,
  name: z.string(),
  order: z.number().int(),
  durationMinDays: z.number().int().nullable(),
  durationMaxDays: z.number().int().nullable(),
  costMinJpy: z.number().int().nullable(),
  costMaxJpy: z.number().int().nullable(),
  requiredDocuments: z.array(z.string()).nullable(),
  requiredTests: z.array(z.string()).nullable(),
  relatedRegulationIds: z.array(z.string().uuid()).nullable(),
  pmdaResourceUrls: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
  sourceRefs: z.array(lifecycleTemplateSourceRefResponseSchema).nullable(),
});
export type LifecycleTemplateStepResponse = z.infer<typeof lifecycleTemplateStepResponseSchema>;

/** 工程マスタ・テンプレート一覧項目応答（GET /lifecycle/templates）。 */
export const lifecycleTemplateSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  deviceCategory: lifecycleDeviceCategorySchema,
  procedureType: z.string(),
  status: lifecycleTemplateStatusSchema,
  version: z.number().int(),
  createdAt: z.string().datetime(),
});
export type LifecycleTemplateSummaryResponse = z.infer<
  typeof lifecycleTemplateSummaryResponseSchema
>;

/** GET /api/v1/lifecycle/templates 応答（カーソルページネーション）。 */
export const lifecycleTemplateListResponseSchema = z.object({
  items: z.array(lifecycleTemplateSummaryResponseSchema),
  nextCursor: z.string().nullable(),
});
export type LifecycleTemplateListResponse = z.infer<typeof lifecycleTemplateListResponseSchema>;

/** GET /api/v1/lifecycle/templates/:id 応答（工程一覧込み）。 */
export const lifecycleTemplateDetailResponseSchema = lifecycleTemplateSummaryResponseSchema.extend({
  steps: z.array(lifecycleTemplateStepResponseSchema),
});
export type LifecycleTemplateDetailResponse = z.infer<typeof lifecycleTemplateDetailResponseSchema>;

/**
 * 工程マスタ・個別工程の作成/更新入力（設計変更書③ CRUD /api/v1/admin/lifecycle-templates、admin/editor限定）。
 * phaseCodeで大工程を指定する（DBの内部UUIDをクライアントに意識させないため、公開APIのphase.codeと同じ値）。
 * sourceRefsは「根拠必須」（設計変更書④AI設計）のため1件以上を必須とする。
 */
export const adminLifecycleTemplateStepInputSchema = z.object({
  phaseCode: lifecyclePhaseCodeSchema,
  name: z.string().trim().min(1),
  order: z.number().int().min(0),
  durationMinDays: z.number().int().min(0).nullable(),
  durationMaxDays: z.number().int().min(0).nullable(),
  costMinJpy: z.number().int().min(0).nullable(),
  costMaxJpy: z.number().int().min(0).nullable(),
  requiredDocuments: z.array(z.string().trim().min(1)),
  requiredTests: z.array(z.string().trim().min(1)),
  relatedRegulationIds: z.array(z.string().uuid()),
  pmdaResourceUrls: z.array(z.string().trim().min(1)),
  notes: z.string().trim().max(2000).nullable(),
  sourceRefs: z.array(lifecycleTemplateSourceRefResponseSchema).min(1),
});
export type AdminLifecycleTemplateStepInput = z.infer<typeof adminLifecycleTemplateStepInputSchema>;

/**
 * POST /api/v1/admin/lifecycle-templates リクエストボディ。テンプレート本体+工程一覧を一括で作成する
 * （regulation_versionsのfullText同様、工程マスタも1ドキュメントとして丸ごと扱う設計）。
 */
export const createLifecycleTemplateRequestSchema = z.object({
  jurisdiction: jurisdictionCodeSchema,
  deviceCategory: lifecycleDeviceCategorySchema,
  procedureType: z.string().trim().min(1),
  steps: z.array(adminLifecycleTemplateStepInputSchema).min(1),
});
export type CreateLifecycleTemplateRequest = z.infer<typeof createLifecycleTemplateRequestSchema>;

/**
 * PATCH /api/v1/admin/lifecycle-templates/:id リクエストボディ。DRAFTのみ許可、工程一覧は丸ごと置き換え
 * （個別工程の差分更新はサポートしない。createと同一形状）。
 */
export const updateLifecycleTemplateRequestSchema = createLifecycleTemplateRequestSchema;
export type UpdateLifecycleTemplateRequest = CreateLifecycleTemplateRequest;

/** GET /api/v1/admin/lifecycle-templates クエリ（全ステータス対象、公開用GETと異なりstatus絞り込み可）。 */
export const listAdminLifecycleTemplatesQuerySchema = cursorPaginationQuerySchema.extend({
  jurisdiction: jurisdictionCodeSchema.optional(),
  deviceCategory: lifecycleDeviceCategorySchema.optional(),
  procedureType: z.string().trim().min(1).optional(),
  status: lifecycleTemplateStatusSchema.optional(),
});
export type ListAdminLifecycleTemplatesQuery = z.infer<
  typeof listAdminLifecycleTemplatesQuerySchema
>;
