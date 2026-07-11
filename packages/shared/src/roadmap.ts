import { z } from "zod";

import { lifecycleTemplateStepResponseSchema } from "./lifecycle";

/**
 * ロードマップ工程の進捗状態（設計変更書② DB変更 ProjectRoadmapStep.status 準拠、Phase7 7-3 PR②-1）。
 * project_tasks.status（S16）と同じ3値だが、テンプレートから生成される別エンティティのため専用スキーマとする
 * （apps/api RoadmapStepStatusと一致）。
 */
export const roadmapStepStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export type RoadmapStepStatus = z.infer<typeof roadmapStepStatusSchema>;

/** ロードマップ工程ステータスの日本語表示名（TASK_STATUS_LABELSと同方針）。 */
export const ROADMAP_STEP_STATUS_LABELS: Record<RoadmapStepStatus, string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

/**
 * ロードマップの状態（設計変更書② DB変更 ProjectRoadmap.status 準拠）。ACTIVEのみを先行定義する
 * （apps/api RoadmapStatusと一致、値の追加要否は生成/再生成usecaseの実装時に確定）。
 */
export const roadmapStatusSchema = z.enum(["ACTIVE"]);
export type RoadmapStatus = z.infer<typeof roadmapStatusSchema>;

/**
 * POST /api/v1/projects/:id/roadmap リクエスト（設計変更書③「生成（テンプレ適用+AI補完）Pro+」、
 * Phase7 7-3 PR②-1）。テンプレートは事前にGET /lifecycle/templatesで選択済みの前提でtemplateIdのみ受け取る。
 */
export const generateProjectRoadmapRequestSchema = z.object({
  templateId: z.string().uuid(),
});
export type GenerateProjectRoadmapRequest = z.infer<typeof generateProjectRoadmapRequestSchema>;

/**
 * ロードマップ工程応答（GET /projects/:id/roadmap、設計変更書①S24「各工程に期間・概算費用・必要書類・
 * 必要試験・関連通知・PMDA資料リンク」準拠）。templateStepにマスタ内容を結合して返す（複製はしない、
 * schema.prismaのコメント準拠）。customFieldsは用途が設計書に未記載のため本PRでは応答に含めない
 * （推測実装禁止、YAGNI）。
 */
export const projectRoadmapStepResponseSchema = z.object({
  id: z.string().uuid(),
  templateStep: lifecycleTemplateStepResponseSchema,
  status: roadmapStepStatusSchema,
  plannedStartDate: z.string().date().nullable(),
  plannedEndDate: z.string().date().nullable(),
  actualStartDate: z.string().date().nullable(),
  actualEndDate: z.string().date().nullable(),
  assigneeId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProjectRoadmapStepResponse = z.infer<typeof projectRoadmapStepResponseSchema>;

/**
 * ロードマップ応答（POST/GET /projects/:id/roadmap）。aiAdjustmentsはPR②-1では常にnull
 * （AI補完はPR②-2で実装、型・内容が未確定のため現時点ではz.null()のみを許容する）。
 */
export const projectRoadmapResponseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  templateId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  aiAdjustments: z.null(),
  status: roadmapStatusSchema,
  steps: z.array(projectRoadmapStepResponseSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProjectRoadmapResponse = z.infer<typeof projectRoadmapResponseSchema>;

/**
 * PATCH /api/v1/projects/:id/roadmap/steps/:stepId リクエスト（設計変更書③「進捗・期日・担当更新」）。
 * 全フィールドoptionalの部分更新。日付・担当者はnullを明示的に指定することでクリア可能
 * （undefined=変更なし、null=クリア、update-project-task-status-request等と異なりPATCH本来のセマンティクス）。
 */
export const updateProjectRoadmapStepRequestSchema = z.object({
  status: roadmapStepStatusSchema.optional(),
  plannedStartDate: z.string().date().nullable().optional(),
  plannedEndDate: z.string().date().nullable().optional(),
  actualStartDate: z.string().date().nullable().optional(),
  actualEndDate: z.string().date().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});
export type UpdateProjectRoadmapStepRequest = z.infer<
  typeof updateProjectRoadmapStepRequestSchema
>;

/** ロードマップ工程パラメータ（PATCH /projects/:id/roadmap/steps/:stepId、UUID検証）。 */
export const projectRoadmapStepIdParamSchema = z.object({
  id: z.string().uuid(),
  stepId: z.string().uuid(),
});
export type ProjectRoadmapStepIdParam = z.infer<typeof projectRoadmapStepIdParamSchema>;
