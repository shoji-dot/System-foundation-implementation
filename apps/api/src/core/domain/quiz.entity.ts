/**
 * クイズドメインエンティティ（設計書④ quizzes/quiz_questions 準拠、S12）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  /** 選択肢配列（設計書④ quiz_questions.choices jsonb 準拠）。 */
  choices: QuizChoice[];
  correctChoiceId: string;
  explanation: string | null;
  /** クイズ内の表示順。 */
  order: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
}
