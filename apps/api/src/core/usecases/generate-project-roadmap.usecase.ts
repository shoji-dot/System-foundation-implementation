import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { LIFECYCLE_TEMPLATE_REPOSITORY } from "../domain/lifecycle-template.repository";
import type { LifecycleTemplateRepository } from "../domain/lifecycle-template.repository";
import { hasReachedRoadmapLimit, PLAN_ROADMAP_LIMITS } from "../domain/plan-entitlements";
import type { ProjectRoadmapDetail } from "../domain/project-roadmap.entity";
import { PROJECT_ROADMAP_REPOSITORY } from "../domain/project-roadmap.repository";
import type { ProjectRoadmapRepository } from "../domain/project-roadmap.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";
import type { ProjectRepository } from "../domain/project.repository";
import type { Plan } from "../domain/user.entity";

export interface GenerateProjectRoadmapInput {
  userId: string;
  plan: Plan;
  projectId: string;
  templateId: string;
}

/**
 * ロードマップ生成ユースケース（設計変更書③ POST /projects/:id/roadmap、Pro+、Phase7 7-3 PR②-1）。
 * テンプレートのstepをそのままプロジェクトへ複製する（AI補完はPR②-2で追加、設計変更書④「代替案: マスタのみ
 * （AIなし）は差別化不足のため却下」を踏まえ、本PRは複製のみの中間状態として位置づける）。
 * ログイン中のユーザー自身が所有するプロジェクトのみを対象とする（CreateProjectTaskUsecaseと同じ方針）。
 */
@Injectable()
export class GenerateProjectRoadmapUsecase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ROADMAP_REPOSITORY)
    private readonly projectRoadmapRepository: ProjectRoadmapRepository,
    @Inject(LIFECYCLE_TEMPLATE_REPOSITORY)
    private readonly lifecycleTemplateRepository: LifecycleTemplateRepository,
  ) {}

  async execute(input: GenerateProjectRoadmapInput): Promise<ProjectRoadmapDetail> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundException("指定されたプロジェクトが見つかりません。");
    }

    const currentCount = await this.projectRoadmapRepository.countForUser(input.userId);
    if (hasReachedRoadmapLimit(input.plan, currentCount)) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Forbidden",
          status: HttpStatus.FORBIDDEN,
          detail: this.buildLimitMessage(input.plan),
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const template = await this.lifecycleTemplateRepository.findPublishedDetailById(
      input.templateId,
    );
    if (!template) {
      throw new NotFoundException("指定された工程マスタが見つからないか、未公開です。");
    }

    const roadmap = await this.projectRoadmapRepository.create({
      projectId: input.projectId,
      templateId: input.templateId,
      generatedAt: new Date(),
      templateStepIds: template.steps.map((step) => step.id),
    });
    if (!roadmap) {
      throw new ConflictException("このプロジェクトには既にロードマップが生成されています。");
    }

    return roadmap;
  }

  private buildLimitMessage(plan: Plan): string {
    if (plan === "FREE") {
      return "ロードマップの生成はPro以上のプランでご利用いただけます。プランのアップグレードをご検討ください。";
    }
    return `現在のプランで生成・保存できるロードマップ数の上限（${PLAN_ROADMAP_LIMITS[plan]}件）に達しています。プランのアップグレードをご検討ください。`;
  }
}
