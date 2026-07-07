import type { ProjectTask, TaskStatus } from "./project-task.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaProjectTaskRepository）。
 */
export const PROJECT_TASK_REPOSITORY = Symbol("PROJECT_TASK_REPOSITORY");

export interface CreateProjectTaskInput {
  projectId: string;
  title: string;
  dueDate?: Date;
  assignee?: string;
}

export interface ProjectTaskRepository {
  /**
   * 指定プロジェクトのタスク一覧を作成順で返す（設計書⑤ GET /api/v1/projects/:id/tasks、S16）。
   * プロジェクトの所有者確認は呼び出し元のユースケースで ProjectRepository.findByIdForUser により行う。
   */
  findManyForProject(projectId: string): Promise<ProjectTask[]>;
  /** 設計書⑤ POST /api/v1/projects/:id/tasks（S16）。 */
  create(input: CreateProjectTaskInput): Promise<ProjectTask>;
  /**
   * 指定プロジェクトに属するタスクをidで取得する（設計書⑤ PATCH /api/v1/projects/:id/tasks/:taskId の
   * 所有者確認、S16）。他プロジェクトのタスク、または存在しない場合はnull（ProjectRepository.findByIdForUser
   * と同じ方針）。
   */
  findByIdForProject(id: string, projectId: string): Promise<ProjectTask | null>;
  /** 設計書⑤ PATCH /api/v1/projects/:id/tasks/:taskId（S16「チェックリスト・タスク」の完了チェック）。 */
  updateStatus(id: string, status: TaskStatus): Promise<ProjectTask>;
}
