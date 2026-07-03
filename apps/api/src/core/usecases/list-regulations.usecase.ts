import { Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { RegulationType } from "../domain/regulation.entity";
import type { RegulationListResult, RegulationRepository } from "../domain/regulation.repository";
import { REGULATION_REPOSITORY } from "../domain/regulation.repository";

export interface ListRegulationsInput {
  jurisdiction?: JurisdictionCode;
  type?: RegulationType;
  q?: string;
  cursor?: string;
  limit: number;
}

/**
 * 法規文書一覧取得ユースケース（設計書⑤ GET /api/v1/regulations）。
 */
@Injectable()
export class ListRegulationsUsecase {
  constructor(
    @Inject(REGULATION_REPOSITORY)
    private readonly regulationRepository: RegulationRepository,
  ) {}

  async execute(input: ListRegulationsInput): Promise<RegulationListResult> {
    const q = input.q?.trim();

    return this.regulationRepository.findMany({
      jurisdictionCode: input.jurisdiction,
      type: input.type,
      q: q ? q : undefined,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
