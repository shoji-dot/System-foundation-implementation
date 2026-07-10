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
 * 大工程コードの日本語表示名（S22 工程マスタ管理画面の工程選択UIで使用）。
 * apps/api/src/infrastructure/database/seeders/lifecycle-phase.seeder.ts の名称・順序と同一の値
 * （設計変更書②「企画〜販売終了の18工程」、固定18件の構造データのため出典不要、JURISDICTION_LABELSと同方針）。
 */
export const LIFECYCLE_PHASE_LABELS: Record<LifecyclePhaseCode, string> = {
  PLANNING: "企画",
  MARKET_RESEARCH: "市場調査",
  DESIGN: "設計",
  RISK_ISO14971: "リスクマネジメント（ISO14971）",
  QMS: "QMS構築",
  TESTING: "試験",
  REG_STRATEGY: "薬事戦略",
  SUBMISSION: "承認申請",
  PMDA_CONSULT: "PMDA相談",
  APPROVAL: "承認・認証",
  REIMBURSEMENT: "保険償還",
  LAUNCH: "上市",
  SALES: "販売",
  CHANGE_CONTROL: "変更管理",
  COMPLAINT: "苦情処理",
  CAPA: "CAPA",
  RECALL: "回収",
  DISCONTINUATION: "販売終了",
};

/**
 * 規制の法体系区分（Phase7 7-2再設計、2026-07-10ユーザー承認）。医療機器・体外診断用医薬品・
 * コンビネーションプロダクトは薬機法上そもそも根拠条文・分類体系が異なるため、Classとは独立した
 * 最上位の軸として持つ。COMBINATION_PRODUCTは将来拡張用（初期マスタデータの投入対象外）。
 */
export const LIFECYCLE_FRAMEWORKS = ["MEDICAL_DEVICE", "IVD", "COMBINATION_PRODUCT"] as const;
export type LifecycleFramework = (typeof LIFECYCLE_FRAMEWORKS)[number];
export const lifecycleFrameworkSchema = z.enum(LIFECYCLE_FRAMEWORKS);

/** 規制の法体系区分の日本語表示名（S22管理画面で使用）。 */
export const LIFECYCLE_FRAMEWORK_LABELS: Record<LifecycleFramework, string> = {
  MEDICAL_DEVICE: "医療機器",
  IVD: "体外診断用医薬品",
  COMBINATION_PRODUCT: "コンビネーションプロダクト",
};

/**
 * 医療機器のクラス分類（Phase7 7-2再設計）。旧LifecycleDeviceCategoryからSaMD/IVD/ACTIVEを除去し、
 * Class本来の4区分+OTHERのみに単純化。SaMD/能動植込み等は「特性」でありcharacteristics（タグ）で表現する
 * （本フィールドには含めない）。framework=MEDICAL_DEVICE以外では意味を持たないためoptional。
 */
export const LIFECYCLE_DEVICE_CLASSES = [
  "CLASS_I",
  "CLASS_II",
  "CLASS_III",
  "CLASS_IV",
  "OTHER",
] as const;
export type LifecycleDeviceClass = (typeof LIFECYCLE_DEVICE_CLASSES)[number];
export const lifecycleDeviceClassSchema = z.enum(LIFECYCLE_DEVICE_CLASSES);

/** クラス分類の日本語表示名（S22管理画面で使用）。 */
export const LIFECYCLE_DEVICE_CLASS_LABELS: Record<LifecycleDeviceClass, string> = {
  CLASS_I: "クラスI",
  CLASS_II: "クラスII",
  CLASS_III: "クラスIII",
  CLASS_IV: "クラスIV",
  OTHER: "その他",
};

/**
 * 新規性区分（Phase7 7-2再設計）。新医療機器/改良医療機器/後発医療機器はPMDAの審査期間・手数料が
 * 大きく異なる別軸のため独立させた。届出等、概念自体が当てはまらない手続きではoptional。
 */
export const LIFECYCLE_PRODUCT_NOVELTIES = ["NEW", "MODIFIED", "GENERIC"] as const;
export type LifecycleProductNovelty = (typeof LIFECYCLE_PRODUCT_NOVELTIES)[number];
export const lifecycleProductNoveltySchema = z.enum(LIFECYCLE_PRODUCT_NOVELTIES);

/** 新規性区分の日本語表示名（S22管理画面で使用）。 */
export const LIFECYCLE_PRODUCT_NOVELTY_LABELS: Record<LifecycleProductNovelty, string> = {
  NEW: "新医療機器",
  MODIFIED: "改良医療機器",
  GENERIC: "後発医療機器",
};

/** 工程マスタの公開状態（設計変更書②「status(draft/published)」準拠、2状態のみ）。 */
export const LIFECYCLE_TEMPLATE_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type LifecycleTemplateStatus = (typeof LIFECYCLE_TEMPLATE_STATUSES)[number];
export const lifecycleTemplateStatusSchema = z.enum(LIFECYCLE_TEMPLATE_STATUSES);

/** 工程マスタの公開状態の日本語表示名（S22管理画面の一覧・詳細で使用）。 */
export const LIFECYCLE_TEMPLATE_STATUS_LABELS: Record<LifecycleTemplateStatus, string> = {
  DRAFT: "下書き",
  PUBLISHED: "公開済み",
};

/**
 * GET /api/v1/lifecycle/templates クエリ（Phase7 7-2再設計）。
 * approvalRoute（旧procedureType）はJP/US/EU等で語彙が大きく異なるため自由文字列（apps/api側と同方針）。
 * characteristicsはSaMD/能動植込み等のタグ名による絞り込み（tags/taggings経由）で、現時点ではAPI側の
 * 絞り込みは未実装（一覧・詳細応答への表示のみ先行実装。フィルタは将来のroadmap wizard実装時に追加、YAGNI）。
 */
export const listLifecycleTemplatesQuerySchema = cursorPaginationQuerySchema.extend({
  jurisdiction: jurisdictionCodeSchema.optional(),
  framework: lifecycleFrameworkSchema.optional(),
  deviceClass: lifecycleDeviceClassSchema.optional(),
  approvalRoute: z.string().trim().min(1).optional(),
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

/**
 * 工程マスタ・テンプレート一覧項目応答（GET /lifecycle/templates、Phase7 7-2再設計）。
 * deviceClass/productNoveltyはframework=MEDICAL_DEVICE以外や届出等一部手続きでnull。
 * characteristicsはtags/taggings（TaggableType.LIFECYCLE_TEMPLATE）経由のタグ名一覧（例: ["SAMD"]）。
 * effectiveFrom/effectiveToは「この期間・費用データが妥当と確認できた実世界の期間」（監査用）。
 */
export const lifecycleTemplateSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  framework: lifecycleFrameworkSchema,
  deviceClass: lifecycleDeviceClassSchema.nullable(),
  productNovelty: lifecycleProductNoveltySchema.nullable(),
  approvalRoute: z.string(),
  characteristics: z.array(z.string()),
  status: lifecycleTemplateStatusSchema,
  version: z.number().int(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
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
 * POST /api/v1/admin/lifecycle-templates リクエストボディ（Phase7 7-2再設計）。テンプレート本体+工程一覧を
 * 一括で作成する（regulation_versionsのfullText同様、工程マスタも1ドキュメントとして丸ごと扱う設計）。
 * deviceClass/productNoveltyはnullable（framework=MEDICAL_DEVICE以外や届出等では概念が無いため）。
 * characteristicsは自由文字列タグ名の配列（例: ["SAMD","ACTIVE_IMPLANTABLE"]、admin入力時に
 * find-or-createでtagsへ登録する。空配列許容）。effectiveToはnullable（現在も有効な場合）。
 */
export const createLifecycleTemplateRequestSchema = z.object({
  jurisdiction: jurisdictionCodeSchema,
  framework: lifecycleFrameworkSchema,
  deviceClass: lifecycleDeviceClassSchema.nullable(),
  productNovelty: lifecycleProductNoveltySchema.nullable(),
  approvalRoute: z.string().trim().min(1),
  characteristics: z.array(z.string().trim().min(1)).default([]),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
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
  framework: lifecycleFrameworkSchema.optional(),
  deviceClass: lifecycleDeviceClassSchema.optional(),
  approvalRoute: z.string().trim().min(1).optional(),
  status: lifecycleTemplateStatusSchema.optional(),
});
export type ListAdminLifecycleTemplatesQuery = z.infer<
  typeof listAdminLifecycleTemplatesQuerySchema
>;
