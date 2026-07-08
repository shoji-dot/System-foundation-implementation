import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import { hasReachedProjectLimit, PLAN_PROJECT_LIMITS } from "../domain/plan-entitlements";
import type { Project } from "../domain/project.entity";
import type { ProjectRepository } from "../domain/project.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";
import type { Plan } from "../domain/user.entity";

export interface CreateProjectInput {
  userId: string;
  plan: Plan;
  name: string;
  deviceClass?: string;
  targetJurisdictions: JurisdictionCode[];
}

/**
 * プロジェクト作成ユースケース（設計書⑤ POST /api/v1/projects、S15）。
 * 組織選択UIは未実装のため、常に organizationId=null（個人プロジェクト）として作成する。
 * 設計書⑦「エンタイトルメント層: plan→機能フラグ（プロジェクト数）」に基づき、
 * プラン別の作成上限（ユーザー承認済み方針: FREE=3, PRO=20, ENTERPRISE=無制限）を超える作成を拒否する。
 */
@Injectable()
export class CreateProjectUsecase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const currentCount = await this.projectRepository.countForUser(input.userId);
    if (hasReachedProjectLimit(input.plan, currentCount)) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Forbidden",
          status: HttpStatus.FORBIDDEN,
          detail: `現在のプランで作成できるプロジェクト数の上限（${PLAN_PROJECT_LIMITS[input.plan]}件）に達しています。プランのアップグレードをご検討ください。`,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return this.projectRepository.create({
      userId: input.userId,
      name: input.name,
      deviceClass: input.deviceClass,
      targetJurisdictions: input.targetJurisdictions,
    });
  }
}
