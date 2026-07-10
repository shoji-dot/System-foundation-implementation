import type { JurisdictionCode } from "./jurisdiction.entity";
import type {
  LifecycleDeviceCategory,
  LifecycleTemplate,
  LifecycleTemplateDetail,
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

/**
 * 一般ユーザー向け公開API（設計変更書③ GET /lifecycle/templates系）はstatus=PUBLISHEDのみを
 * 対象とする（regulationsの編集ワークフローと同じ方針。DRAFT中の版はadmin向けCRUD・S22実装時に
 * 別のリポジトリメソッドで提供する、7-2 PR③にて追加予定）。
 */
export interface LifecycleTemplateRepository {
  findManyPublished(filters: LifecycleTemplateListFilters): Promise<LifecycleTemplateListResult>;
  /** 設計変更書③ GET /lifecycle/templates/:id（工程一覧込み）。存在しない/未公開の場合は null。 */
  findPublishedDetailById(id: string): Promise<LifecycleTemplateDetail | null>;
}
