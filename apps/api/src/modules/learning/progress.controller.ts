import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import type { ProgressResponse } from "@yakuji/shared";
import { progressResponseSchema } from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RecordProgressUsecase } from "../../core/usecases/record-progress.usecase";

import { RecordProgressRequestDto } from "./dto/record-progress-request.dto";

/**
 * 設計書⑤ POST /api/v1/progress（S13 学習進捗、進捗POST）。
 * ログイン中のユーザー自身の進捗としてupsertするため200 OK（signup等の新規作成とは異なり、
 * 同一レッスンへの再送信は上書きとして扱う冪等な操作のため）。
 * 設計書⑬画面遷移: S13はS11/S12経由でのみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("progress")
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly recordProgressUsecase: RecordProgressUsecase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async record(
    @Req() request: AuthenticatedRequest,
    @Body() body: RecordProgressRequestDto,
  ): Promise<ProgressResponse> {
    const progress = await this.recordProgressUsecase.execute({
      userId: request.user.userId,
      lessonId: body.lessonId,
      status: body.status,
      score: body.score,
    });

    return progressResponseSchema.parse({
      id: progress.id,
      lessonId: progress.lessonId,
      status: progress.status,
      score: progress.score,
      completedAt: progress.completedAt ? progress.completedAt.toISOString() : null,
    });
  }
}
