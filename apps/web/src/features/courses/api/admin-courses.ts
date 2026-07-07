import type {
  CourseDetailResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "@yakuji/shared";
import { courseDetailResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちコース管理向けAPIクライアント（ADMIN/EDITOR限定、設計書⑦ RBAC）。
 * 一覧取得は@/features/learning/api/coursesのlistCourses（公開APIと同一）を再利用し（DRY）、
 * ここではadmin/coursesの作成・更新・削除のみを扱う。Reactに依存しない純粋関数として実装する
 * （accessTokenは呼び出し側から渡す、admin-users.tsと同方針）。
 */
export class AdminCoursesApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new AdminCoursesApiError(problem?.detail ?? fallbackMessage, response.status);
}

/** POST /api/v1/admin/courses（コース作成、ADMIN/EDITOR限定）。 */
export async function createCourse(
  accessToken: string,
  body: CreateCourseRequest,
): Promise<CourseDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/courses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "コースの作成に失敗しました。");
  }

  return courseDetailResponseSchema.parse(await response.json());
}

/** PATCH /api/v1/admin/courses/:id（コース更新、ADMIN/EDITOR限定）。 */
export async function updateCourse(
  accessToken: string,
  courseId: string,
  body: UpdateCourseRequest,
): Promise<CourseDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "コースの更新に失敗しました。");
  }

  return courseDetailResponseSchema.parse(await response.json());
}

/** DELETE /api/v1/admin/courses/:id（コース削除、ADMIN/EDITOR限定）。 */
export async function deleteCourse(accessToken: string, courseId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    await parseProblemOrThrow(response, "コースの削除に失敗しました。");
  }
}
