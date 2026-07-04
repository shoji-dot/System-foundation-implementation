import { z } from "zod";

import { CLASSIFICATION_SCHEMES } from "./classifications";
import { JURISDICTION_CODES } from "./jurisdictions";
import { REGULATION_STATUSES, REGULATION_TYPES } from "./regulations";

/**
 * ヘルスチェック応答スキーマ（Phase 0: 起動確認用）。
 */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/**
 * カーソルページネーション共通クエリ（設計書 ⑤ API構成 準拠）。
 */
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

/**
 * 法域コード Zod スキーマ。
 */
export const jurisdictionCodeSchema = z.enum(JURISDICTION_CODES);

/**
 * 法域応答（設計書④ jurisdictions 準拠、GET /api/v1/jurisdictions）。
 */
export const jurisdictionResponseSchema = z.object({
  id: z.string().uuid(),
  code: jurisdictionCodeSchema,
  name: z.string(),
  authority: z.string(),
});
export type JurisdictionResponse = z.infer<typeof jurisdictionResponseSchema>;

/**
 * 法規文書の種別・ステータス Zod スキーマ。
 */
export const regulationTypeSchema = z.enum(REGULATION_TYPES);
export const regulationStatusSchema = z.enum(REGULATION_STATUSES);

/**
 * GET /api/v1/regulations クエリ（設計書⑤ ?jurisdiction=&type=&q=&tag= 準拠）。
 * tag によるフィルタは tags/taggings テーブル未実装のため今回は対象外
 * （tags/taggings 追加時に別途対応する）。
 */
export const listRegulationsQuerySchema = cursorPaginationQuerySchema.extend({
  jurisdiction: jurisdictionCodeSchema.optional(),
  type: regulationTypeSchema.optional(),
  q: z.string().trim().min(1).optional(),
});
export type ListRegulationsQuery = z.infer<typeof listRegulationsQuerySchema>;

/**
 * 法域の最小情報（一覧表示用、regulations/classifications 共通で使用）。
 */
export const jurisdictionSummaryResponseSchema = z.object({
  code: jurisdictionCodeSchema,
  name: z.string(),
});

/**
 * 法規文書一覧項目応答（設計書④ regulations 準拠、GET /api/v1/regulations）。
 */
export const regulationSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  type: regulationTypeSchema,
  subtype: z.string().nullable(),
  title: z.string(),
  docNumber: z.string().nullable(),
  status: regulationStatusSchema,
  effectiveDate: z.string().date().nullable(),
  sourceUrl: z.string().nullable(),
});
export type RegulationSummaryResponse = z.infer<typeof regulationSummaryResponseSchema>;

/**
 * カーソルページネーション応答（法規文書一覧、設計書⑤ カーソルページネーション準拠）。
 */
export const regulationListResponseSchema = z.object({
  items: z.array(regulationSummaryResponseSchema),
  nextCursor: z.string().nullable(),
});
export type RegulationListResponse = z.infer<typeof regulationListResponseSchema>;

/**
 * 条文セクション応答（設計書④ regulation_sections 準拠）。
 */
export const regulationSectionResponseSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  heading: z.string(),
  body: z.string(),
});
export type RegulationSectionResponse = z.infer<typeof regulationSectionResponseSchema>;

/**
 * 法規文書バージョン応答（設計書④⑧ regulation_versions 準拠）。
 */
export const regulationVersionResponseSchema = z.object({
  id: z.string().uuid(),
  versionNo: z.number().int().positive(),
  publishedAt: z.string().datetime(),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().nullable(),
  summary: z.string().nullable(),
  changeSummary: z.string().nullable(),
  fullText: z.string(),
  sections: z.array(regulationSectionResponseSchema),
});
export type RegulationVersionResponse = z.infer<typeof regulationVersionResponseSchema>;

/**
 * 法規文書パラメータ（設計書⑤ GET /api/v1/regulations/:id 等、UUID検証）。
 */
export const regulationIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type RegulationIdParam = z.infer<typeof regulationIdParamSchema>;

/**
 * 法規文書詳細応答（設計書⑤ GET /api/v1/regulations/:id、最新版）。
 * 関連文書(regulation_relations)・タグは今回は対象外（別コミットで追加予定）。
 */
export const regulationDetailResponseSchema = regulationSummaryResponseSchema.extend({
  latestVersion: regulationVersionResponseSchema.nullable(),
});
export type RegulationDetailResponse = z.infer<typeof regulationDetailResponseSchema>;

/**
 * GET /api/v1/regulations/:id/versions クエリ（設計書⑤ 改正履歴）。
 * cursor は versionNo をそのまま文字列化した値（このサブリソースはバージョン番号によるキーセット方式）。
 */
export const listRegulationVersionsQuerySchema = z.object({
  cursor: z.string().regex(/^\d+$/, "cursorは数値文字列である必要があります。").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListRegulationVersionsQuery = z.infer<typeof listRegulationVersionsQuerySchema>;

/**
 * 法規文書バージョン一覧項目応答（本文・条文セクションを含まない軽量版、版切替UI用）。
 */
export const regulationVersionSummaryResponseSchema = regulationVersionResponseSchema.omit({
  fullText: true,
  sections: true,
});
export type RegulationVersionSummaryResponse = z.infer<
  typeof regulationVersionSummaryResponseSchema
>;

/**
 * カーソルページネーション応答（法規文書バージョン一覧、設計書⑤ GET /api/v1/regulations/:id/versions）。
 */
export const regulationVersionListResponseSchema = z.object({
  items: z.array(regulationVersionSummaryResponseSchema),
  nextCursor: z.string().nullable(),
});
export type RegulationVersionListResponse = z.infer<typeof regulationVersionListResponseSchema>;

/**
 * GET /api/v1/regulations/:id/diff クエリ（設計書⑤ ?from=&to=、版間差分）。
 * from/to は versionNo（regulation内で一意な連番）。同一版同士の差分は無意味なため禁止する。
 */
export const regulationDiffQuerySchema = z
  .object({
    from: z.coerce.number().int().positive(),
    to: z.coerce.number().int().positive(),
  })
  .refine((value) => value.from !== value.to, {
    message: "fromとtoには異なる版番号を指定してください。",
    path: ["to"],
  });
export type RegulationDiffQuery = z.infer<typeof regulationDiffQuerySchema>;

/**
 * 条文セクション差分ステータス。
 * - added: to側にのみ存在（新設）
 * - removed: from側にのみ存在（削除）
 * - modified: 両側に存在するが本文が異なる（改正）
 * - unchanged: 両側に存在し本文も同一
 */
export const regulationSectionDiffStatusSchema = z.enum([
  "added",
  "removed",
  "modified",
  "unchanged",
]);
export type RegulationSectionDiffStatus = z.infer<typeof regulationSectionDiffStatusSchema>;

/**
 * 条文セクション単位の差分応答。path（条・項・号の階層）でfrom/to両版のセクションを突合する
 * （設計書④ regulation_sectionsのコメント「RAG・全文検索の単位」に準拠し、セクション単位を差分の粒度とする）。
 */
export const regulationSectionDiffResponseSchema = z.object({
  path: z.string(),
  heading: z.string(),
  status: regulationSectionDiffStatusSchema,
  fromBody: z.string().nullable(),
  toBody: z.string().nullable(),
});
export type RegulationSectionDiffResponse = z.infer<typeof regulationSectionDiffResponseSchema>;

/**
 * 法規文書版間差分応答（設計書⑤ GET /api/v1/regulations/:id/diff?from=&to=）。
 * from/toは軽量版（本文・セクション一覧を含まない）のメタ情報のみで、内容差分はsectionsで表現する。
 */
export const regulationDiffResponseSchema = z.object({
  regulationId: z.string().uuid(),
  from: regulationVersionSummaryResponseSchema,
  to: regulationVersionSummaryResponseSchema,
  sections: z.array(regulationSectionDiffResponseSchema),
});
export type RegulationDiffResponse = z.infer<typeof regulationDiffResponseSchema>;

/**
 * 機器分類スキーム Zod スキーマ（設計書④ device_classifications 準拠）。
 */
export const classificationSchemeSchema = z.enum(CLASSIFICATION_SCHEMES);

/**
 * GET /api/v1/classifications クエリ（設計書⑤ ?scheme=JMDN&q= 準拠）。
 * jurisdictionは明記が無いが、device_classifications.jurisdiction_idによる絞り込みも実用上必要なため追加
 * （schemeがJP限定でないケース、例えばFDA_PRODUCT_CODEとJMDNを混在させないための任意フィルタ）。
 */
export const listClassificationsQuerySchema = cursorPaginationQuerySchema.extend({
  scheme: classificationSchemeSchema.optional(),
  jurisdiction: jurisdictionCodeSchema.optional(),
  q: z.string().trim().min(1).optional(),
});
export type ListClassificationsQuery = z.infer<typeof listClassificationsQuerySchema>;

/**
 * 機器分類応答（設計書④ device_classifications 準拠、GET /api/v1/classifications）。
 */
export const classificationResponseSchema = z.object({
  id: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  scheme: classificationSchemeSchema,
  code: z.string(),
  name: z.string(),
  class: z.string().nullable(),
  definition: z.string().nullable(),
});
export type ClassificationResponse = z.infer<typeof classificationResponseSchema>;

/**
 * カーソルページネーション応答（機器分類一覧、設計書⑤ GET /api/v1/classifications）。
 */
export const classificationListResponseSchema = z.object({
  items: z.array(classificationResponseSchema),
  nextCursor: z.string().nullable(),
});
export type ClassificationListResponse = z.infer<typeof classificationListResponseSchema>;

/**
 * 機器分類パラメータ（設計書⑤ GET /api/v1/classifications/:id/mappings 等、UUID検証）。
 */
export const classificationIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type ClassificationIdParam = z.infer<typeof classificationIdParamSchema>;

/**
 * 機器分類マッピング応答（設計書④ classification_mappings 準拠、GET /api/v1/classifications/:id/mappings）。
 * classificationは相手側（自分以外）の分類情報。
 */
export const classificationMappingResponseSchema = z.object({
  id: z.string().uuid(),
  confidence: z.number(),
  classification: classificationResponseSchema,
});
export type ClassificationMappingResponse = z.infer<typeof classificationMappingResponseSchema>;

/**
 * 機器分類マッピング一覧応答。件数が少ないためページネーションは行わない
 * （jurisdictions一覧と同様の判断）。
 */
export const classificationMappingListResponseSchema = z.object({
  items: z.array(classificationMappingResponseSchema),
});
export type ClassificationMappingListResponse = z.infer<
  typeof classificationMappingListResponseSchema
>;

/**
 * GET /api/v1/search スコープ（設計書⑤ ?scope=all|regulation|jmdn|generic-name|learning 準拠）。
 * jmdn/generic-nameはどちらもdevice_classificationsが対象だが、検索フィールド(code優先 / name・definition優先)が異なる。
 * learning(courses/lessons)は当該テーブル未実装のため、指定時は常に空配列を返す（設計書⑤のスコープ列挙自体は維持）。
 */
export const searchScopeSchema = z.enum(["all", "regulation", "jmdn", "generic-name", "learning"]);
export type SearchScope = z.infer<typeof searchScopeSchema>;

/**
 * GET /api/v1/search クエリ（設計書⑤ ?q=&scope=&tag= 準拠）。
 * tagはtags/taggings未実装のため今回は対象外（regulations一覧と同様の判断）。
 */
export const searchQuerySchema = cursorPaginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  scope: searchScopeSchema.default("all"),
  tag: z.string().optional(),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * 統合検索結果項目応答（設計書⑤⑩準拠）。regulations/classificationsを横断するdiscriminated union。
 */
export const regulationSearchResultResponseSchema = z.object({
  type: z.literal("regulation"),
  id: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  regulationType: regulationTypeSchema,
  title: z.string(),
  docNumber: z.string().nullable(),
  status: regulationStatusSchema,
  effectiveDate: z.string().date().nullable(),
});

export const classificationSearchResultResponseSchema = z.object({
  type: z.literal("classification"),
  id: z.string().uuid(),
  jurisdiction: jurisdictionSummaryResponseSchema,
  scheme: classificationSchemeSchema,
  code: z.string(),
  name: z.string(),
  class: z.string().nullable(),
});

export const searchResultItemResponseSchema = z.discriminatedUnion("type", [
  regulationSearchResultResponseSchema,
  classificationSearchResultResponseSchema,
]);
export type SearchResultItemResponse = z.infer<typeof searchResultItemResponseSchema>;

/**
 * 統合検索応答。scope=all の場合 nextCursor は常に null（複数ソース横断の統一カーソル未実装、設計書⑩の高度化時に対応）。
 */
export const searchResponseSchema = z.object({
  items: z.array(searchResultItemResponseSchema),
  nextCursor: z.string().nullable(),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;
