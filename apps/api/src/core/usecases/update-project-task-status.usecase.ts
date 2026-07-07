import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { ProjectTask, TaskStatus } from "../domain/project-task.entity";
import type { ProjectTaskRepository } from "../domain/project-task.repository";
import { PROJECT_TASK_REPOSITORY } from "../domain/project-task.repository";
import type { ProjectRepository } from "../domain/project.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";

export interface UpdateProjectTaskStatusInput {
  userId: string;
  projectId: string;
  taskId: string;
  status: TaskStatus;
}

/**
 * プロジェクトタスクステータス更新ユースケース（設計書⑤ PATCH /api/v1/projects/:id/tasks/:taskId、
 * S16「チェックリスト・タスク」の完了チェック）。
 * ログイン中のユーザー自身が所有するプロジェクトに属するタスクのみを対象とする。プロジェクト・タスクの
 * いずれについても、他ユーザーの所有物、または存在しない場合は一律NotFoundExceptionとする
 * （GetProjectDetailUsecaseと同じ方針）。
 */
@Injectable()
export class UpdateProjectTaskStatusUsecase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_TASK_REPOSITORY) private readonly projectTaskRepository: ProjectTaskRepository,
  ) {}

  async execute(input: UpdateProjectTaskStatusInput): Promise<ProjectTask> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundException("指定されたプロジェクトが見つかりません。");
    }

    const task = await this.projectTaskRepository.findByIdForProject(
      input.taskId,
      input.projectId,
    );
    if (!task) {
      throw new NotFoundException("指定されたタスクが見つかりません。");
    }

    return this.projectTaskRepository.updateStatus(input.taskId, input.status);
  }
}
