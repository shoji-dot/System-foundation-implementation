import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { COURSE_REPOSITORY } from "../../core/domain/course.repository";
import { LESSON_REPOSITORY } from "../../core/domain/lesson.repository";
import { PROGRESS_REPOSITORY } from "../../core/domain/progress.repository";
import { QUIZ_REPOSITORY } from "../../core/domain/quiz.repository";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { GetLessonDetailUsecase } from "../../core/usecases/get-lesson-detail.usecase";
import { ListCoursesUsecase } from "../../core/usecases/list-courses.usecase";
import { ListLessonsUsecase } from "../../core/usecases/list-lessons.usecase";
import { ListQuizzesUsecase } from "../../core/usecases/list-quizzes.usecase";
import { RecordProgressUsecase } from "../../core/usecases/record-progress.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaCourseRepository } from "../../infrastructure/database/repositories/prisma-course.repository";
import { PrismaLessonRepository } from "../../infrastructure/database/repositories/prisma-lesson.repository";
import { PrismaProgressRepository } from "../../infrastructure/database/repositories/prisma-progress.repository";
import { PrismaQuizRepository } from "../../infrastructure/database/repositories/prisma-quiz.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { CoursesController } from "./courses.controller";
import { LessonsController } from "./lessons.controller";
import { ProgressController } from "./progress.controller";
import { QuizzesController } from "./quizzes.controller";

/**
 * 学習系モジュール（設計書③ modules/learning、⑤ courses/lessons/quizzes系API＋進捗POST、S10-S13）。
 * これでcourses一覧・lessons一覧/詳細・quizzes一覧・progress記録まで、Phase 2の学習系APIが揃った。
 */
@Module({
  // JwtAuthGuardが要求するTOKEN_SERVICEのため、他モジュール同様にJwtModuleを自己完結でimportする。
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [CoursesController, LessonsController, QuizzesController, ProgressController],
  providers: [
    ListCoursesUsecase,
    ListLessonsUsecase,
    GetLessonDetailUsecase,
    ListQuizzesUsecase,
    RecordProgressUsecase,
    { provide: COURSE_REPOSITORY, useClass: PrismaCourseRepository },
    { provide: LESSON_REPOSITORY, useClass: PrismaLessonRepository },
    { provide: QUIZ_REPOSITORY, useClass: PrismaQuizRepository },
    { provide: PROGRESS_REPOSITORY, useClass: PrismaProgressRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class LearningModule {}
