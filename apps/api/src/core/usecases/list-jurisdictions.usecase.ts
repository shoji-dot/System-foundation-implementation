import { Inject, Injectable } from "@nestjs/common";

import type { Jurisdiction } from "../domain/jurisdiction.entity";
import type { JurisdictionRepository } from "../domain/jurisdiction.repository";
import { JURISDICTION_REPOSITORY } from "../domain/jurisdiction.repository";

/**
 * 法域一覧取得ユースケース（設計書⑤ GET /api/v1/jurisdictions）。
 */
@Injectable()
export class ListJurisdictionsUsecase {
  constructor(
    @Inject(JURISDICTION_REPOSITORY)
    private readonly jurisdictionRepository: JurisdictionRepository,
  ) {}

  async execute(): Promise<Jurisdiction[]> {
    return this.jurisdictionRepository.findAll();
  }
}
