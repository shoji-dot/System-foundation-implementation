import { Inject, Injectable } from "@nestjs/common";

import type { ListProjectsResult, ProjectRepository } from "../domain/project.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";

export interface ListProjectsInput {
  userId: string;
  cursor?: string;
  limit: number;
}

/**
 * プロジェクト一覧取得ユースケース（設計書⑤ GET /api/v1/projects、S15、S04「プロジェクト概況」）。
 * ログイン中のユーザー自身が所有するプロジェクトのみを対象とする。
 */
@Injectable()
export class ListProjectsUsecase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  async execute(input: ListProjectsInput): Promise<ListProjectsResult> {
    return this.projectRepository.findManyForUser(input);
  }
}
