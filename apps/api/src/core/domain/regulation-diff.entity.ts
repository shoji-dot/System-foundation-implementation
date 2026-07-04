import type { RegulationVersionSummary } from "./regulation-version.entity";

/**
 * 法規文書版間差分ドメインエンティティ（設計書⑤ GET /api/v1/regulations/:id/diff?from=&to=）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export type RegulationSectionDiffStatus = "added" | "removed" | "modified" | "unchanged";

/**
 * 条文セクション単位の差分（path＝条・項・号の階層パスで from/to のセクションを突合）。
 */
export interface RegulationSectionDiff {
  path: string;
  heading: string;
  status: RegulationSectionDiffStatus;
  /** from側に存在しない場合（added）は null。 */
  fromBody: string | null;
  /** to側に存在しない場合（removed）は null。 */
  toBody: string | null;
}

export interface RegulationDiff {
  regulationId: string;
  from: RegulationVersionSummary;
  to: RegulationVersionSummary;
  sections: RegulationSectionDiff[];
}
