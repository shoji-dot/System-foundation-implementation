import type { JurisdictionCode } from "./jurisdiction.entity";
import type { Project } from "./project.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaProjectRepository）。
 */
export const PROJECT_REPOSITORY = Symbol("PROJECT_REPOSITORY");

export interface ListProjectsForUserInput {
  userId: string;
  /** カーソルページネーション（設計書⑤）: 前回応答の nextCursor をそのまま渡す。 */
  cursor?: string;
  limit: number;
}

export interface ListProjectsResult {
  items: Project[];
  /** 次ページが無い場合は null（設計書⑤ カーソルページネーション）。 */
  nextCursor: string | null;
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  deviceClass?: string;
  targetJurisdictions: JurisdictionCode[];
}

export interface ProjectRepository {
  /** ログイン中のユーザー自身が所有するプロジェクト一覧を作成順で返す（設計書⑤ GET /api/v1/projects）。 */
  findManyForUser(input: ListProjectsForUserInput): Promise<ListProjectsResult>;
  /** 設計書⑤ POST /api/v1/projects。組織選択UI未実装のため常にorganizationId=nullで作成する。 */
  create(input: CreateProjectInput): Promise<Project>;
  /**
   * 指定ユーザーが所有するプロジェクトをidで取得する（設計書⑤ GET /api/v1/projects/:id、
   * /projects/:id/tasks の所有者確認、S16）。他ユーザーのプロジェクト、または存在しない場合はnull
   * （Projectエンティティはuser_idを公開しないため、絞り込みはクエリ側で行う）。
   */
  findByIdForUser(id: string, userId: string): Promise<Project | null>;
}
