import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { QuizListResponse } from "@yakuji/shared";
import { quizListResponseSchema } from "@yakuji/shared";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListQuizzesUsecase } from "../../core/usecases/list-quizzes.usecase";

import { ListQuizzesQueryDto } from "./dto/list-quizzes-query.dto";

/**
 * 設計書⑤ GET /api/v1/quizzes?lessonId=（S12 クイズ/結果）。
 * correctChoiceIdも含めて返す（採点はクライアント側、結果はPOST /api/v1/progressで送信する運用）。
 * 設計書⑬画面遷移: S12はS11経由でのみ到達するため、JwtAuthGuardで保護する。
 */
@Controller("quizzes")
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly listQuizzesUsecase: ListQuizzesUsecase) {}

  @Get()
  async list(@Query() query: ListQuizzesQueryDto): Promise<QuizListResponse> {
    const items = await this.listQuizzesUsecase.execute({ lessonId: query.lessonId });

    return quizListResponseSchema.parse({
      items: items.map((quiz) => ({
        id: quiz.id,
        lessonId: quiz.lessonId,
        title: quiz.title,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          question: question.question,
          choices: question.choices,
          correctChoiceId: question.correctChoiceId,
          explanation: question.explanation,
          order: question.order,
        })),
      })),
    });
  }
}
