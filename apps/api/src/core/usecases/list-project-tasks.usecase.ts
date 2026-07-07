import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { ProjectTask } from "../domain/project-task.entity";
import type { ProjectTaskRepository } from "../domain/project-task.repository";
import { PROJECT_TASK_REPOSITORY } from "../domain/project-task.repository";
import type { ProjectRepository } from "../domain/project.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";

export interface ListProjectTasksInput {
  userId: string;
  projectId: string;
}

/**
 * プロジェクトタスク一覧取得ユースケース（設計書⑤ GET /api/v1/projects/:id/tasks、S16）。
 * ログイン中のユーザー自身が所有するプロジェクトのみを対象とする。他ユーザーのプロジェクト、または
 * 存在しない場合は一律NotFoundExceptionとする（GetProjectDetailUsecaseと同じ方針）。
 */
@Injectable()
export class ListProjectTasksUsecase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_TASK_REPOSITORY) private readonly projectTaskRepository: ProjectTaskRepository,
  ) {}

  async execute(input: ListProjectTasksInput): Promise<ProjectTask[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundException("指定されたプロジェクトが見つかりません。");
    }

    return this.projectTaskRepository.findManyForProject(input.projectId);
  }
}
