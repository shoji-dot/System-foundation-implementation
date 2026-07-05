import { Inject, Injectable } from "@nestjs/common";

import type { JurisdictionCode } from "../domain/jurisdiction.entity";
import type { RegulationType } from "../domain/regulation.entity";
import type { UpdateFeedRepository, UpdateFeedResult } from "../domain/update-feed.repository";
import { UPDATE_FEED_REPOSITORY } from "../domain/update-feed.repository";

export interface ListUpdatesInput {
  since?: string;
  jurisdiction?: JurisdictionCode;
  type?: RegulationType;
  cursor?: string;
  limit: number;
}

/**
 * 更新フィード取得ユースケース（設計書⑤ GET /api/v1/updates、S04/S17）。
 */
@Injectable()
export class ListUpdatesUsecase {
  constructor(
    @Inject(UPDATE_FEED_REPOSITORY)
    private readonly updateFeedRepository: UpdateFeedRepository,
  ) {}

  async execute(input: ListUpdatesInput): Promise<UpdateFeedResult> {
    return this.updateFeedRepository.findMany({
      since: input.since ? new Date(input.since) : undefined,
      jurisdictionCode: input.jurisdiction,
      type: input.type,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
