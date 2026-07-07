import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { Project } from "../domain/project.entity";
import type { ProjectRepository } from "../domain/project.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";

export interface GetProjectDetailInput {
  userId: string;
  projectId: string;
}

/**
 * プロジェクト詳細取得ユースケース（設計書⑤に明記は無いがS16「プロジェクト詳細」表示に必要なため
 * ユーザー承認済みで追加、GET /api/v1/projects/:id）。
 * 他ユーザーのプロジェクト、または存在しない場合は、存在有無を漏らさないため一律NotFoundExceptionとする
 * （設計書⑦OWASP対応、DeleteSubscriptionUsecaseと同じ方針）。
 */
@Injectable()
export class GetProjectDetailUsecase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  async execute(input: GetProjectDetailInput): Promise<Project> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundException("指定されたプロジェクトが見つかりません。");
    }

    return project;
  }
}
