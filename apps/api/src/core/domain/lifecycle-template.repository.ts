import type { JurisdictionCode } from "./jurisdiction.entity";
import type { LifecyclePhase, LifecyclePhaseCode } from "./lifecycle-phase.entity";
import type {
  LifecycleDeviceCategory,
  LifecycleTemplate,
  LifecycleTemplateDetail,
  LifecycleTemplateSourceRef,
  LifecycleTemplateStatus,
} from "./lifecycle-template.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaLifecycleTemplateRepository）。
 */
export const LIFECYCLE_TEMPLATE_REPOSITORY = Symbol("LIFECYCLE_TEMPLATE_REPOSITORY");

export interface LifecycleTemplateListFilters {
  jurisdictionCode?: JurisdictionCode;
  deviceCategory?: LifecycleDeviceCategory;
  procedureType?: string;
  /** カーソルページネーション（設計変更書③）: 前回応答の nextCursor をそのまま渡す。 */
  cursor?: string;
  limit: number;
}

export interface LifecycleTemplateListResult {
  items: LifecycleTemplate[];
  nextCursor: string | null;
}

/** 管理画面向け一覧フィルタ（設計変更書③ CRUD /api/v1/admin/lifecycle-templates）。全ステータス対象。 */
export interface AdminLifecycleTemplateListFilters extends LifecycleTemplateListFilters {
  status?: LifecycleTemplateStatus;
}

/** 工程マスタ・個別工程の作成/更新入力（admin CRUD向け、phaseはcodeで指定）。 */
export interface LifecycleTemplateStepWriteInput {
  phaseCode: LifecyclePhaseCode;
  name: string;
  order: number;
  durationMinDays: number | null;
  durationMaxDays: number | null;
  costMinJpy: number | null;
  costMaxJpy: number | null;
  requiredDocuments: string[];
  requiredTests: string[];
  relatedRegulationIds: string[];
  pmdaResourceUrls: string[];
  notes: string | null;
  sourceRefs: LifecycleTemplateSourceRef[];
}

/** 工程マスタ・テンプレート本体の作成/更新入力（admin CRUD向け）。 */
export interface LifecycleTemplateWriteInput {
  jurisdictionCode: JurisdictionCode;
  deviceCategory: LifecycleDeviceCategory;
  procedureType: string;
  steps: LifecycleTemplateStepWriteInput[];
}

/**
 * 一般ユーザー向け公開API（設計変更書③ GET /lifecycle/templates系）はstatus=PUBLISHEDのみを
 * 対象とする（regulationsの編集ワークフローと同じ方針）。admin向けCRUD・S22実装（7-2 PR③）に伴い、
 * 全ステータスを対象とする管理系メソッドを追加する。
 */
export interface LifecycleTemplateRepository {
  findManyPublished(filters: LifecycleTemplateListFilters): Promise<LifecycleTemplateListResult>;
  /** 設計変更書③ GET /lifecycle/templates/:id（工程一覧込み）。存在しない/未公開の場合は null。 */
  findPublishedDetailById(id: string): Promise<LifecycleTemplateDetail | null>;

  /** 管理画面向け一覧（設計変更書③ GET /admin/lifecycle-templates、admin/editor限定）。全ステータス対象。 */
  findManyForAdmin(
    filters: AdminLifecycleTemplateListFilters,
  ): Promise<LifecycleTemplateListResult>;
  /** 管理画面向け詳細。ステータスを問わず取得する（存在しない場合は null）。 */
  findDetailByIdForAdmin(id: string): Promise<LifecycleTemplateDetail | null>;
  /** 大工程マスタ(LifecyclePhase)の固定18件一覧。ステップ作成時のphaseCode検証に用いる。 */
  findAllPhases(): Promise<LifecyclePhase[]>;
  /** 新規テンプレート作成（常にstatus=DRAFT）。 */
  create(input: LifecycleTemplateWriteInput): Promise<LifecycleTemplateDetail>;
  /**
   * DRAFTのテンプレートのみ更新可能（呼び出し側usecaseで事前チェック済み）。工程一覧は丸ごと置き換える。
   * 直前の事前チェックとの間に状態が変化した場合（レース対策の防御的再チェック）は null を返す。
   */
  update(id: string, input: LifecycleTemplateWriteInput): Promise<LifecycleTemplateDetail | null>;
  /** DRAFTのテンプレートのみ削除可能。レース対策の防御的再チェックに失敗した場合は false を返す。 */
  delete(id: string): Promise<boolean>;
  /** DRAFT→PUBLISHED遷移。存在しない/既に公開済みの場合（レース対策含む）は null を返す。 */
  publish(id: string): Promise<LifecycleTemplateDetail | null>;
}
