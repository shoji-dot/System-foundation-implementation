import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationVersionStatus } from "./regulation-version.entity";
import type {
  RegulationJurisdictionSummary,
  RegulationStatus,
  RegulationType,
} from "./regulation.entity";

/**
 * 取込パイプライン（設計書⑨）専用の書き込みポート。
 * RegulationRepository（設計書⑤ 公開API向け、PUBLISHED版のみを読む読み取り専用の契約）とは責務を分離する。
 * 実装は infrastructure/database/repositories 配下（PrismaRegulationIngestionRepository）。
 */
export const REGULATION_INGESTION_REPOSITORY = Symbol("REGULATION_INGESTION_REPOSITORY");

/** 差分検出（設計書⑨「doc_number+ハッシュ比較」）のため返す既存regulationの最新版情報。全ステータス対象。 */
export interface LatestRegulationVersionForIngestion {
  regulationId: string;
  latestVersionNo: number;
  latestFullText: string;
}

export interface CreateRegulationWithDraftVersionInput {
  jurisdictionCode: JurisdictionCode;
  type: RegulationType;
  subtype: string | null;
  title: string;
  docNumber: string;
  effectiveDate: Date;
  sourceUrl: string;
  fullText: string;
}

export interface AppendDraftVersionInput {
  regulationId: string;
  versionNo: number;
  title: string;
  subtype: string | null;
  type: RegulationType;
  effectiveDate: Date;
  sourceUrl: string;
  fullText: string;
  /** 非AIの簡易差分要約（設計書⑨のAI要約はPhase3保留中のため代用、要ユーザー確認済み）。 */
  changeSummary: string;
}

/** 設計書⑤ カーソルページネーション準拠。id（UUIDv7、生成順に単調増加）によるキーセット方式。 */
export interface PendingReviewVersionListFilters {
  cursor?: string;
  limit: number;
}

/** S20 取込レビュー一覧項目。draft/review中の版のみ対象（PUBLISHED済みは一般公開APIの対象）。 */
export interface PendingReviewVersionSummary {
  id: string;
  regulationId: string;
  regulationTitle: string;
  jurisdiction: RegulationJurisdictionSummary;
  type: RegulationType;
  status: Exclude<RegulationVersionStatus, "PUBLISHED">;
  versionNo: number;
  effectiveFrom: Date;
  changeSummary: string | null;
  createdAt: Date;
}

export interface PendingReviewVersionListResult {
  items: PendingReviewVersionSummary[];
  nextCursor: string | null;
}

/** S20 取込レビュー詳細。校閲対象のdraft/review版本文と、現行公開版（無ければnull）を並べて返す。 */
export interface PendingReviewVersionDetail extends PendingReviewVersionSummary {
  fullText: string;
  currentPublished: {
    versionId: string;
    versionNo: number;
    fullText: string;
    effectiveFrom: Date;
  } | null;
}

/**
 * 公開(publish)実行結果（設計書⑫ S20、⑧編集ワークフロー準拠）。
 * 旧公開版が存在した場合はeffectiveToをクローズし、closedPreviousVersionに詳細を返す。
 * 存在しない場合（初版公開）はRegulation.statusはACTIVEのまま変化しない。
 */
export interface PublishVersionResult {
  regulationId: string;
  versionId: string;
  versionNo: number;
  publishedAt: Date;
  effectiveFrom: Date;
  regulationStatus: RegulationStatus;
  closedPreviousVersion: { versionId: string; effectiveTo: Date } | null;
}

export interface RegulationIngestionRepository {
  /** 法域+docNumberで既存regulationを検索する（全ステータス対象）。無ければnull（新規として扱う）。 */
  findLatestByDocNumber(
    jurisdictionCode: JurisdictionCode,
    docNumber: string,
  ): Promise<LatestRegulationVersionForIngestion | null>;
  /**
   * 新規regulation + 初版（DRAFT, versionNo=1）を作成する。
   */
  createWithDraftVersion(
    input: CreateRegulationWithDraftVersionInput,
  ): Promise<{ regulationId: string; versionId: string }>;
  /**
   * 既存regulationにDRAFT版を追加する。親Regulationのtitle/effectiveDate/sourceUrl/type/subtypeも
   * 即時更新する（draft作成時点で反映する方針、要ユーザー確認済み）。
   */
  appendDraftVersion(input: AppendDraftVersionInput): Promise<{ versionId: string }>;
  /** 設計書⑫ S20向け: status=DRAFT/REVIEWの版一覧（校閲待ちキュー、作成日時昇順）。 */
  listPendingReview(
    filters: PendingReviewVersionListFilters,
  ): Promise<PendingReviewVersionListResult>;
  /** 設計書⑫ S20向け: 校閲対象の版1件の詳細＋現行公開版（比較用）。存在しない、またはPUBLISHED済みの場合はnull。 */
  findPendingReviewDetail(versionId: string): Promise<PendingReviewVersionDetail | null>;
  /**
   * 設計書⑫ S20向け: 校閲対象の版を公開する（DRAFT/REVIEW→PUBLISHED）。
   * 旧公開版が存在すればeffectiveToを新版のeffectiveFromでクローズし、Regulation.statusをAMENDEDにする
   * （無ければACTIVEのまま）。対象版が存在しない、またはPUBLISHED済みの場合はnull。
   */
  publishVersion(versionId: string): Promise<PublishVersionResult | null>;
}
