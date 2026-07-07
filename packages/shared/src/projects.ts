import { z } from "zod";

import { cursorPaginationQuerySchema, jurisdictionCodeSchema } from "./schemas";

/**
 * 実務支援プロジェクト応答（設計書④ user_projects 準拠、⑫ S15/S16、S04「プロジェクト概況」）。
 * 設計書のorg_idは必須列だが、signup時にOrganizationが自動作成されないため、
 * organizationIdはnullableとする（組織未所属ユーザーは個人プロジェクトとしてnullになる。ユーザー承認済み）。
 */
export const projectResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  deviceClass: z.string().nullable(),
  targetJurisdictions: z.array(jurisdictionCodeSchema),
  organizationId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});
export type ProjectResponse = z.infer<typeof projectResponseSchema>;

/**
 * GET /api/v1/projects クエリ（設計書⑤ カーソルページネーション準拠、S15）。
 */
export const listProjectsQuerySchema = cursorPaginationQuerySchema;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/**
 * カーソルページネーション応答（プロジェクト一覧、GET /api/v1/projects）。
 */
export const projectListResponseSchema = z.object({
  items: z.array(projectResponseSchema),
  nextCursor: z.string().nullable(),
});
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>;

/**
 * POST /api/v1/projects リクエスト（設計書④ user_projects: name, device_class, target_jurisdictions準拠）。
 * userIdはbodyに含めずアクセストークンから取得する（POST /api/v1/progress等と同じ方針）。
 * organizationIdもbodyでは受け取らない（組織選択UIは未実装のため、現時点では常に個人プロジェクトとして作成する）。
 */
export const createProjectRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  deviceClass: z.string().trim().min(1).max(100).optional(),
  targetJurisdictions: z.array(jurisdictionCodeSchema).default([]),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

/**
 * プロジェクトパラメータ（設計書⑤ GET /api/v1/projects/:id 等、UUID検証）。
 * 設計書⑤の主要エンドポイント一覧に明記は無いが、S16「プロジェクト詳細」表示に必要なため
 * ユーザー承認済みで追加。
 */
export const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;

/**
 * タスクステータス（設計書④ project_tasks.status 準拠）。
 */
export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

/**
 * タスクステータスの日本語表示名。フロントエンドの複数箇所（S16タスク一覧・ステータス変更UI）で
 * 共通利用するため、DRY原則に基づきここに集約する（REGULATION_TYPE_LABELS等と同じ方針）。
 */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

/**
 * プロジェクトタスク応答（設計書④ project_tasks 準拠、GET/POST /api/v1/projects/:id/tasks、S16）。
 * checklists マスタは今回作らないため（[[createProjectRequestSchema]]と同様、ユーザー承認済み）、
 * checklistItemRefは応答に含めない。title をユーザー自由入力の表示ラベルとして返す。
 */
export const projectTaskResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: taskStatusSchema,
  dueDate: z.string().date().nullable(),
  assignee: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type ProjectTaskResponse = z.infer<typeof projectTaskResponseSchema>;

/**
 * プロジェクトタスク一覧応答（GET /api/v1/projects/:id/tasks、S16）。
 * プロジェクトあたりのタスク件数は少ないため、classification_mappings一覧と同様ページネーションは行わない。
 */
export const projectTaskListResponseSchema = z.object({
  items: z.array(projectTaskResponseSchema),
});
export type ProjectTaskListResponse = z.infer<typeof projectTaskListResponseSchema>;

/**
 * POST /api/v1/projects/:id/tasks リクエスト（設計書④ project_tasks: title(自由入力)/due_date/assignee準拠）。
 * statusは常にTODOで作成する（ステータス変更APIは今回のスコープ外、次回検討）。
 */
export const createProjectTaskRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueDate: z.string().date().optional(),
  assignee: z.string().trim().min(1).max(100).optional(),
});
export type CreateProjectTaskRequest = z.infer<typeof createProjectTaskRequestSchema>;

/**
 * プロジェクトタスクパラメータ（設計書⑤ PATCH /api/v1/projects/:id/tasks/:taskId、UUID検証）。
 * idはプロジェクト、taskIdはタスク（ネストしたルートのため両方をパラメータに含む）。
 */
export const projectTaskIdParamSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
});
export type ProjectTaskIdParam = z.infer<typeof projectTaskIdParamSchema>;

/**
 * PATCH /api/v1/projects/:id/tasks/:taskId リクエスト（S16「チェックリスト・タスク」の完了チェック）。
 * 設計書⑤の主要エンドポイント一覧に明記は無いが、タスク一覧・作成と対で必要なためユーザー承認済みで追加。
 * title/dueDate/assigneeの編集は今回のスコープ外（次回検討）、statusのみ更新可能とする。
 */
export const updateProjectTaskStatusRequestSchema = z.object({
  status: taskStatusSchema,
});
export type UpdateProjectTaskStatusRequest = z.infer<typeof updateProjectTaskStatusRequestSchema>;
