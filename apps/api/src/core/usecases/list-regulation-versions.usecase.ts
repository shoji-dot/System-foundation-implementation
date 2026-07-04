import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type {
  RegulationRepository,
  RegulationVersionListResult,
} from "../domain/regulation.repository";
import { REGULATION_REPOSITORY } from "../domain/regulation.repository";

export interface ListRegulationVersionsInput {
  regulationId: string;
  cursor?: string;
  limit: number;
}

/**
 * 法規文書バージョン一覧（改正履歴）取得ユースケース（設計書⑤ GET /api/v1/regulations/:id/versions）。
 */
@Injectable()
export class ListRegulationVersionsUsecase {
  constructor(
    @Inject(REGULATION_REPOSITORY)
    private readonly regulationRepository: RegulationRepository,
  ) {}

  async execute(input: ListRegulationVersionsInput): Promise<RegulationVersionListResult> {
    const result = await this.regulationRepository.findVersions(input.regulationId, {
      cursor: input.cursor,
      limit: input.limit,
    });

    if (!result) {
      throw new NotFoundException("指定された法規文書が見つかりません。");
    }

    return result;
  }
}
