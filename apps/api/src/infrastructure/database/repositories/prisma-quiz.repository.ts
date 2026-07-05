import { Injectable } from "@nestjs/common";
import type {
  Prisma,
  Quiz as PrismaQuiz,
  QuizQuestion as PrismaQuizQuestion,
} from "@prisma/client";
import { z } from "zod";

import type { Quiz, QuizChoice, QuizQuestion } from "../../../core/domain/quiz.entity";
import type { QuizListFilters, QuizRepository } from "../../../core/domain/quiz.repository";
import { PrismaService } from "../prisma.service";

type QuizWithQuestions = PrismaQuiz & { questions: PrismaQuizQuestion[] };

/** quiz_questions.choices（jsonb）の実行時検証（設計書④ jsonb保持方針、DBには型保証が無いため）。 */
const quizChoicesSchema = z.array(z.object({ id: z.string(), text: z.string() }));

/**
 * QuizRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern）。
 * レッスンあたりのクイズ件数は少ないためページネーションは行わない（classification_mappingsと同様の判断）。
 */
@Injectable()
export class PrismaQuizRepository implements QuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: QuizListFilters): Promise<Quiz[]> {
    const where: Prisma.QuizWhereInput = {};
    if (filters.lessonId) {
      where.lessonId = filters.lessonId;
    }

    const records = await this.prisma.quiz.findMany({
      where,
      orderBy: { id: "asc" },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    return records.map((record: QuizWithQuestions) => this.toDomain(record));
  }

  private toDomain(record: QuizWithQuestions): Quiz {
    return {
      id: record.id,
      lessonId: record.lessonId,
      title: record.title,
      questions: record.questions.map((question) => this.toQuestionDomain(question)),
    };
  }

  private toQuestionDomain(record: PrismaQuizQuestion): QuizQuestion {
    return {
      id: record.id,
      question: record.question,
      choices: this.parseChoices(record.choices),
      correctChoiceId: record.correctChoiceId,
      explanation: record.explanation,
      order: record.order,
    };
  }

  private parseChoices(value: Prisma.JsonValue): QuizChoice[] {
    return quizChoicesSchema.parse(value);
  }
}
