import { Controller, Get, UseGuards } from "@nestjs/common";
import type { JurisdictionResponse } from "@yakuji/shared";
import { jurisdictionResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListJurisdictionsUsecase } from "../../core/usecases/list-jurisdictions.usecase";

/**
 * 設計書⑤ GET /api/v1/jurisdictions。
 * 設計書⑬画面遷移: S06/S07を含む主要画面はS02ログイン後のみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("jurisdictions")
@UseGuards(JwtAuthGuard)
export class JurisdictionsController {
  constructor(private readonly listJurisdictionsUsecase: ListJurisdictionsUsecase) {}

  @Get()
  async list(): Promise<JurisdictionResponse[]> {
    const jurisdictions = await this.listJurisdictionsUsecase.execute();

    return jurisdictions.map((jurisdiction) => jurisdictionResponseSchema.parse(jurisdiction));
  }
}
