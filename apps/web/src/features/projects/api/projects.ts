import type {
  CreateProjectRequest,
  CreateProjectTaskRequest,
  ProjectListResponse,
  ProjectResponse,
  ProjectTaskListResponse,
  ProjectTaskResponse,
  TaskStatus,
} from "@yakuji/shared";
import {
  projectListResponseSchema,
  projectResponseSchema,
  projectTaskListResponseSchema,
  projectTaskResponseSchema,
} from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 実務支援プロジェクト（設計書⑤ GET/POST /api/v1/projects、/projects/:id/tasks、S15/S16、
 * S04「プロジェクト概況」）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す）。
 */
export class ProjectApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new ProjectApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListProjectsParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/projects（S04「プロジェクト概況」の最新n件、およびS15一覧のカーソルページネーション）。 */
export async function listProjects(
  accessToken: string,
  params: ListProjectsParams = {},
): Promise<ProjectListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(`${API_BASE_URL}/projects${queryString ? `?${queryString}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "プロジェクト一覧の取得に失敗しました。");
  }

  return projectListResponseSchema.parse(await response.json());
}

/** POST /api/v1/projects（設計書⑤、S15）。 */
export async function createProject(
  accessToken: string,
  request: CreateProjectRequest,
): Promise<ProjectResponse> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "プロジェクトの作成に失敗しました。");
  }

  return projectResponseSchema.parse(await response.json());
}

/** GET /api/v1/projects/:id（S16「プロジェクト詳細」）。 */
export async function getProjectDetail(
  accessToken: string,
  projectId: string,
): Promise<ProjectResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "プロジェクト詳細の取得に失敗しました。");
  }

  return projectResponseSchema.parse(await response.json());
}

/** GET /api/v1/projects/:id/tasks（S16「チェックリスト・タスク・期限」一覧）。 */
export async function listProjectTasks(
  accessToken: string,
  projectId: string,
): Promise<ProjectTaskListResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "タスク一覧の取得に失敗しました。");
  }

  return projectTaskListResponseSchema.parse(await response.json());
}

/** POST /api/v1/projects/:id/tasks（S16）。 */
export async function createProjectTask(
  accessToken: string,
  projectId: string,
  request: CreateProjectTaskRequest,
): Promise<ProjectTaskResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "タスクの作成に失敗しました。");
  }

  return projectTaskResponseSchema.parse(await response.json());
}

/** PATCH /api/v1/projects/:id/tasks/:taskId（S16、タスクの完了チェック）。 */
export async function updateProjectTaskStatus(
  accessToken: string,
  projectId: string,
  taskId: string,
  status: TaskStatus,
): Promise<ProjectTaskResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "タスクの更新に失敗しました。");
  }

  return projectTaskResponseSchema.parse(await response.json());
}
