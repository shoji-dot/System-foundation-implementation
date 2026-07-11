import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { ProjectRoadmapStepDetail, RoadmapStepStatus } from "../domain/project-roadmap.entity";
import { PROJECT_ROADMAP_REPOSITORY } from "../domain/project-roadmap.repository";
import type { ProjectRoadmapRepository } from "../domain/project-roadmap.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";
import type { ProjectRepository } from "../domain/project.repository";
import { USER_REPOSITORY } from "../domain/user.repository";
import type { UserRepository } from "../domain/user.repository";

export interface UpdateProjectRoadmapStepInput {
  userId: string;
  projectId: string;
  stepId: string;
  status?: RoadmapStepStatus;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  assigneeId?: string | null;
}

/**
 * ロードマップ工程・進捗更新ユースケース（設計変更書③ PATCH /projects/:id/roadmap/steps/:stepId
 * 「進捗・期日・担当更新」、Phase7 7-3 PR②-1）。
 * ログイン中のユーザー自身が所有するプロジェクトに属するロードマップのstepのみを対象とする
 * （UpdateProjectTaskStatusUsecaseと同じ方針）。
 */
@Injectable()
export class UpdateProjectRoadmapStepUsecase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ROADMAP_REPOSITORY)
    private readonly projectRoadmapRepository: ProjectRoadmapRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateProjectRoadmapStepInput): Promise<ProjectRoadmapStepDetail> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundException("指定されたプロジェクトが見つかりません。");
    }

    const roadmap = await this.projectRoadmapRepository.findDetailByProjectId(input.projectId);
    if (!roadmap) {
      throw new NotFoundException("指定されたプロジェクトにロードマップが生成されていません。");
    }

    const step = await this.projectRoadmapRepository.findStepByIdForRoadmap(
      input.stepId,
      roadmap.id,
    );
    if (!step) {
      throw new NotFoundException("指定された工程が見つかりません。");
    }

    if (input.assigneeId !== undefined && input.assigneeId !== null) {
      const assignee = await this.userRepository.findById(input.assigneeId);
      if (!assignee) {
        throw new BadRequestException("指定された担当者が見つかりません。");
      }
    }

    return this.projectRoadmapRepository.updateStep(input.stepId, {
      status: input.status,
      plannedStartDate: input.plannedStartDate,
      plannedEndDate: input.plannedEndDate,
      actualStartDate: input.actualStartDate,
      actualEndDate: input.actualEndDate,
      assigneeId: input.assigneeId,
    });
  }
}
