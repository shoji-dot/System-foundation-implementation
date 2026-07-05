/**
 * 法規文書バージョン関連ドメインエンティティ（設計書④⑧ regulation_versions/regulation_sections 準拠）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */

/** 編集ワークフロー状態（設計書⑧「編集ワークフロー: draft → review → published」準拠）。 */
export type RegulationVersionStatus = "DRAFT" | "REVIEW" | "PUBLISHED";

export interface RegulationSection {
  id: string;
  /** 条・項・号の階層パス（例: 第23条の2/第1項/第2号）。 */
  path: string;
  heading: string;
  body: string;
}

export interface RegulationVersion {
  id: string;
  versionNo: number;
  publishedAt: Date;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  fullText: string;
  summary: string | null;
  changeSummary: string | null;
  sections: RegulationSection[];
}

/** バージョン一覧（改正履歴）表示用の軽量版。本文・条文セクションを含まない。 */
export interface RegulationVersionSummary {
  id: string;
  versionNo: number;
  publishedAt: Date;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  summary: string | null;
  changeSummary: string | null;
}
