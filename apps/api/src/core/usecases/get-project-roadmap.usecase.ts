import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { ProjectRoadmapDetail } from "../domain/project-roadmap.entity";
import { PROJECT_ROADMAP_REPOSITORY } from "../domain/project-roadmap.repository";
import type { ProjectRoadmapRepository } from "../domain/project-roadmap.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";
import type { ProjectRepository } from "../domain/project.repository";

export interface GetProjectRoadmapInput {
  userId: string;
  projectId: string;
}

/**
 * ロードマップ取得ユースケース（設計変更書③ GET /projects/:id/roadmap、Phase7 7-3 PR②-1）。
 * ログイン中のユーザー自身が所有するプロジェクトのみを対象とする（GetProjectDetailUsecaseと同じ方針）。
 */
@Injectable()
export class GetProjectRoadmapUsecase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ROADMAP_REPOSITORY)
    private readonly projectRoadmapRepository: ProjectRoadmapRepository,
  ) {}

  async execute(input: GetProjectRoadmapInput): Promise<ProjectRoadmapDetail> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundException("指定されたプロジェクトが見つかりません。");
    }

    const roadmap = await this.projectRoadmapRepository.findDetailByProjectId(input.projectId);
    if (!roadmap) {
      throw new NotFoundException("指定されたプロジェクトにロードマップが生成されていません。");
    }

    return roadmap;
  }
}
