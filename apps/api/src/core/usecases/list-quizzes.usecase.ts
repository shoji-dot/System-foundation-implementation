import { Inject, Injectable } from "@nestjs/common";

import type { Quiz } from "../domain/quiz.entity";
import type { QuizRepository } from "../domain/quiz.repository";
import { QUIZ_REPOSITORY } from "../domain/quiz.repository";

export interface ListQuizzesInput {
  lessonId?: string;
}

/**
 * クイズ一覧取得ユースケース（設計書⑤ GET /api/v1/quizzes?lessonId=、S12）。
 */
@Injectable()
export class ListQuizzesUsecase {
  constructor(
    @Inject(QUIZ_REPOSITORY)
    private readonly quizRepository: QuizRepository,
  ) {}

  async execute(input: ListQuizzesInput): Promise<Quiz[]> {
    return this.quizRepository.findMany({ lessonId: input.lessonId });
  }
}
