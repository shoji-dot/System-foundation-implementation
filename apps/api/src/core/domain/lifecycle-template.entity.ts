import type { JurisdictionCode } from "./jurisdiction.entity";
import type { LifecyclePhase } from "./lifecycle-phase.entity";

/**
 * 機器種別（設計変更書① S23「クラスI–IV/SaMD/IVD/能動/その他」、② DB変更 deviceCategory 準拠）。
 * 既存の device_classifications（JMDN等の詳細分類、S08/S09）とは別軸の簡易カテゴリで、
 * テンプレート選定のみに用いる（分類サブシステム自体の拡張ではない）。
 */
export type LifecycleDeviceCategory =
  "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IV" | "SAMD" | "IVD" | "ACTIVE" | "OTHER";

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
 * 工程マスタ・テンプレート本体（設計変更書② DB変更 LifecycleTemplate 準拠）。
 * regulationと同じ「不変版管理+status」原則をこの1エンティティで表現する（親子分割なし）。
 */
export interface LifecycleTemplate {
  id: string;
  jurisdiction: { code: JurisdictionCode; name: string };
  deviceCategory: LifecycleDeviceCategory;
  procedureType: string;
  status: LifecycleTemplateStatus;
  version: number;
  createdAt: Date;
}

/** GET /lifecycle/templates/:id 用、工程一覧込みの詳細形。 */
export interface LifecycleTemplateDetail extends LifecycleTemplate {
  steps: LifecycleTemplateStep[];
}
