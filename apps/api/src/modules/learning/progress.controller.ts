import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type {
  ProgressListResponse,
  ProgressResponse,
  ProgressSummaryResponse,
} from "@yakuji/shared";
import {
  progressListResponseSchema,
  progressResponseSchema,
  progressSummaryResponseSchema,
} from "@yakuji/shared";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { GetLearningProgressSummaryUsecase } from "../../core/usecases/get-learning-progress-summary.usecase";
import { ListLearningProgressUsecase } from "../../core/usecases/list-learning-progress.usecase";
import { RecordProgressUsecase } from "../../core/usecases/record-progress.usecase";

import { ListProgressQueryDto } from "./dto/list-progress-query.dto";
import { RecordProgressRequestDto } from "./dto/record-progress-request.dto";

/**
 * 設計書⑤ POST /api/v1/progress（S13 学習進捗、進捗POST）。
 * ログイン中のユーザー自身の進捗としてupsertするため200 OK（signup等の新規作成とは異なり、
 * 同一レッスンへの再送信は上書きとして扱う冪等な操作のため）。
 * 設計書⑬画面遷移: S13はS11/S12経由でのみ到達するため、JwtAuthGuardで保護する。
 * summary（GET /api/v1/progress/summary）・一覧（GET /api/v1/progress）は設計書⑤に明記は無いが、
 * S04「学習進捗」向けの集計取得・S13「修了状況・スコア」一覧表示として進捗POSTと対で必要なため
 * ユーザー承認済みで追加。
 */
@Controller("progress")
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly recordProgressUsecase: RecordProgressUsecase,
    private readonly getLearningProgressSummaryUsecase: GetLearningProgressSummaryUsecase,
    private readonly listLearningProgressUsecase: ListLearningProgressUsecase,
  ) {}

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

  @Get("summary")
  async summary(@Req() request: AuthenticatedRequest): Promise<ProgressSummaryResponse> {
    const summary = await this.getLearningProgressSummaryUsecase.execute(request.user.userId);

    return progressSummaryResponseSchema.parse(summary);
  }

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListProgressQueryDto,
  ): Promise<ProgressListResponse> {
    const result = await this.listLearningProgressUsecase.execute({
      userId: request.user.userId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return progressListResponseSchema.parse({
      items: result.items.map((item) => ({
        id: item.id,
        lessonId: item.lessonId,
        status: item.status,
        score: item.score,
        completedAt: item.completedAt ? item.completedAt.toISOString() : null,
        lessonTitle: item.lessonTitle,
        courseId: item.courseId,
        courseTitle: item.courseTitle,
      })),
      nextCursor: result.nextCursor,
    });
  }
}
