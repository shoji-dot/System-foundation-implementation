import type { JurisdictionCode } from "./jurisdiction.entity";
import type { LifecyclePhase } from "./lifecycle-phase.entity";

/**
 * 規制の法体系区分（Phase7 7-2再設計、2026-07-10ユーザー承認）。医療機器・体外診断用医薬品・
 * コンビネーションプロダクトは根拠条文・分類体系が異なるため、Classとは独立した最上位の軸として持つ。
 */
export type LifecycleFramework = "MEDICAL_DEVICE" | "IVD" | "COMBINATION_PRODUCT";

/**
 * 医療機器のクラス分類（Phase7 7-2再設計）。旧LifecycleDeviceCategoryからSaMD/IVD/ACTIVEを除去した
 * Class本来の4区分+OTHER。framework=MEDICAL_DEVICE以外や届出等の一部手続きでは意味を持たないためnull。
 */
export type LifecycleDeviceClass = "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IV" | "OTHER";

/**
 * 新規性区分（Phase7 7-2再設計）。新医療機器/改良医療機器/後発医療機器はPMDAの審査期間・手数料が
 * 大きく異なる別軸のため独立させた。概念が当てはまらない手続き（届出等）ではnull。
 */
export type LifecycleProductNovelty = "NEW" | "MODIFIED" | "GENERIC";

/** 工程マスタの公開状態（設計変更書②「status(draft/published)」準拠、2状態のみ）。 */
export type LifecycleTemplateStatus = "DRAFT" | "PUBLISHED";

/** 工程マスタの根拠出典（設計変更書④AI設計「根拠必須」準拠）。 */
export interface LifecycleTemplateSourceRef {
  title: string;
  url: string;
}

/**
 * 工程マスタの個別工程（設計変更書② DB変更 LifecycleTemplateStep 準拠）。
 * durationMin/MaxDays・costMin/MaxJpyは「概算レンジ・参考値」（設計変更書④AI設計「免責」準拠）。
 */
export interface LifecycleTemplateStep {
  id: string;
  phase: LifecyclePhase;
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

/**
 * 工程マスタ・テンプレート本体（設計変更書② DB変更 LifecycleTemplate 準拠、Phase7 7-2再設計）。
 * regulationと同じ「不変版管理+status」原則をこの1エンティティで表現する（親子分割なし）。
 * characteristicsはSaMD/能動植込み等の「特性」をtags/taggings経由で表現したタグ名一覧
 * （enum固定化せず将来特性が増えてもスキーマ変更不要にするための設計）。
 * effectiveFrom/effectiveToは「この期間・費用データが妥当と確認できた実世界の期間」の監査用
 * （version/statusによるpublishライフサイクル管理とは独立した概念）。
 */
export interface LifecycleTemplate {
  id: string;
  jurisdiction: { code: JurisdictionCode; name: string };
  framework: LifecycleFramework;
  deviceClass: LifecycleDeviceClass | null;
  productNovelty: LifecycleProductNovelty | null;
  approvalRoute: string;
  characteristics: string[];
  status: LifecycleTemplateStatus;
  version: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
}

/** GET /lifecycle/templates/:id 用、工程一覧込みの詳細形。 */
export interface LifecycleTemplateDetail extends LifecycleTemplate {
  steps: LifecycleTemplateStep[];
}
