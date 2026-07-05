/**
 * レッスンドメインエンティティ（設計書④ lessons 準拠、S11）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  body: string;
  /** コース内の表示順。 */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/** レッスン一覧表示用の軽量版。本文(body)を含まない（設計書⑤ GET /api/v1/lessons、S11）。 */
export interface LessonSummary {
  id: string;
  courseId: string;
  title: string;
  order: number;
}
