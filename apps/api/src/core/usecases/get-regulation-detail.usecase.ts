import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { RegulationDetail } from "../domain/regulation.entity";
import type { RegulationRepository } from "../domain/regulation.repository";
import { REGULATION_REPOSITORY } from "../domain/regulation.repository";

/**
 * 法規文書詳細取得ユースケース（設計書⑤ GET /api/v1/regulations/:id、最新版）。
 */
@Injectable()
export class GetRegulationDetailUsecase {
  constructor(
    @Inject(REGULATION_REPOSITORY)
    private readonly regulationRepository: RegulationRepository,
  ) {}

  async execute(id: string): Promise<RegulationDetail> {
    const detail = await this.regulationRepository.findDetailById(id);
    if (!detail) {
      throw new NotFoundException("指定された法規文書が見つかりません。");
    }
    return detail;
  }
}
