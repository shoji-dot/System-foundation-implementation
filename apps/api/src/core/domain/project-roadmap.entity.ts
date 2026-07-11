import type { LifecycleTemplateStep } from "./lifecycle-template.entity";

/**
 * プロジェクトロードマップ・ドメインエンティティ（設計変更書② DB変更 ProjectRoadmap/ProjectRoadmapStep 準拠、
 * Phase7 7-3 PR②-1）。フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * schema.prisma同様、RoadmapStatusはACTIVEのみを先行定義する（生成usecase未実装時点でGENERATING/FAILED等の
 * 要否が未確定だったため。値の追加はPostgres enumのALTER TYPE ADD VALUEで後方互換に可能）。
 */
export type RoadmapStatus = "ACTIVE";

/** 既存 TaskStatus（project_tasks、S16）と同じ3値だが、テンプレートから生成される別エンティティのため専用型とする。 */
export type RoadmapStepStatus = "TODO" | "IN_PROGRESS" | "DONE";

/**
 * aiAdjustmentsはAI補完提案の保存先（設計変更書④AI設計「マスタ値は改変しない」準拠）。
 * PR②-1（本実装）ではAI補完自体を実装しないため常にnull（PR②-2で型・内容を確定する）。
 */
export interface ProjectRoadmap {
  id: string;
  projectId: string;
  templateId: string;
  generatedAt: Date;
  aiAdjustments: null;
  status: RoadmapStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ロードマップの個別工程。LifecycleTemplateStepの内容（期間・費用・書類・試験・根拠等）は複製せず、
 * templateStepId経由で参照する（schema.prismaのコメント準拠）。customFields列はDBに存在するが、
 * 用途が設計書に未記載のため本PRでは扱わない（推測実装禁止、必要になった時点で別途ユーザー確認）。
 */
export interface ProjectRoadmapStep {
  id: string;
  roadmapId: string;
  templateStepId: string;
  status: RoadmapStepStatus;
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /projects/:id/roadmap 応答用、工程マスタ内容（期間・概算費用・必要書類・必要試験・関連通知・
 * PMDA資料リンク、設計変更書①S24準拠）を結合した表示形。
 */
export interface ProjectRoadmapStepDetail extends ProjectRoadmapStep {
  templateStep: LifecycleTemplateStep;
}

export interface ProjectRoadmapDetail extends ProjectRoadmap {
  steps: ProjectRoadmapStepDetail[];
}
