import { Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { Project } from "../domain/project.entity";
import type { ProjectRepository } from "../domain/project.repository";
import { PROJECT_REPOSITORY } from "../domain/project.repository";

export interface CreateProjectInput {
  userId: string;
  name: string;
  deviceClass?: string;
  targetJurisdictions: JurisdictionCode[];
}

/**
 * プロジェクト作成ユースケース（設計書⑤ POST /api/v1/projects、S15）。
 * 組織選択UIは未実装のため、常に organizationId=null（個人プロジェクト）として作成する。
 */
@Injectable()
export class CreateProjectUsecase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    return this.projectRepository.create(input);
  }
}
