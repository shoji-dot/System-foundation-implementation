import type {
  CreateLifecycleTemplateRequest,
  JurisdictionCode,
  LifecycleDeviceClass,
  LifecycleFramework,
  LifecycleTemplateDetailResponse,
  LifecycleTemplateListResponse,
  LifecycleTemplateStatus,
  UpdateLifecycleTemplateRequest,
} from "@yakuji/shared";
import {
  lifecycleTemplateDetailResponseSchema,
  lifecycleTemplateListResponseSchema,
} from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 設計変更書_ライフサイクル管理_SaaS化.md ③「CRUD /admin/lifecycle-templates」（S22 工程マスタ管理、
 * admin/editor限定）向けAPIクライアント。Reactに依存しない純粋関数として実装する
 * （accessTokenは呼び出し側から渡す、admin-courses.ts/admin-tags.tsと同方針）。
 */
export class AdminLifecycleTemplatesApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new AdminLifecycleTemplatesApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListAdminLifecycleTemplatesParams {
  jurisdiction?: JurisdictionCode;
  framework?: LifecycleFramework;
  deviceClass?: LifecycleDeviceClass;
  approvalRoute?: string;
  status?: LifecycleTemplateStatus;
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/admin/lifecycle-templates（全ステータス対象、マスクなし一覧）。 */
export async function listAdminLifecycleTemplates(
  accessToken: string,
  params: ListAdminLifecycleTemplatesParams = {},
): Promise<LifecycleTemplateListResponse> {
  const query = new URLSearchParams();
  if (params.jurisdiction) {
    query.set("jurisdiction", params.jurisdiction);
  }
  if (params.framework) {
    query.set("framework", params.framework);
  }
  if (params.deviceClass) {
    query.set("deviceClass", params.deviceClass);
  }
  if (params.approvalRoute) {
    query.set("approvalRoute", params.approvalRoute);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/admin/lifecycle-templates${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "工程マスタ一覧の取得に失敗しました。");
  }

  return lifecycleTemplateListResponseSchema.parse(await response.json());
}

/** GET /api/v1/admin/lifecycle-templates/:id（全ステータス対象、マスクなし詳細）。 */
export async function getAdminLifecycleTemplateDetail(
  accessToken: string,
  templateId: string,
): Promise<LifecycleTemplateDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/lifecycle-templates/${templateId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "工程マスタ詳細の取得に失敗しました。");
  }

  return lifecycleTemplateDetailResponseSchema.parse(await response.json());
}

/** POST /api/v1/admin/lifecycle-templates（新規作成、常にDRAFT）。 */
export async function createLifecycleTemplate(
  accessToken: string,
  body: CreateLifecycleTemplateRequest,
): Promise<LifecycleTemplateDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/lifecycle-templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "工程マスタの作成に失敗しました。");
  }

  return lifecycleTemplateDetailResponseSchema.parse(await response.json());
}

/** PATCH /api/v1/admin/lifecycle-templates/:id（DRAFTのみ許可、工程一覧を丸ごと置換）。 */
export async function updateLifecycleTemplate(
  accessToken: string,
  templateId: string,
  body: UpdateLifecycleTemplateRequest,
): Promise<LifecycleTemplateDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/lifecycle-templates/${templateId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "工程マスタの更新に失敗しました。");
  }

  return lifecycleTemplateDetailResponseSchema.parse(await response.json());
}

/** DELETE /api/v1/admin/lifecycle-templates/:id（DRAFTのみ許可）。 */
export async function deleteLifecycleTemplate(
  accessToken: string,
  templateId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/lifecycle-templates/${templateId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "工程マスタの削除に失敗しました。");
  }
}

/** POST /api/v1/admin/lifecycle-templates/:id/publish（DRAFT→PUBLISHED、不可逆）。 */
export async function publishLifecycleTemplate(
  accessToken: string,
  templateId: string,
): Promise<LifecycleTemplateDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/lifecycle-templates/${templateId}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "工程マスタの公開に失敗しました。");
  }

  return lifecycleTemplateDetailResponseSchema.parse(await response.json());
}
