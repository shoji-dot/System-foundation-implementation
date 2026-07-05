/**
 * 学習コースドメインエンティティ（設計書④ courses 準拠、S10）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 */
export interface Course {
  id: string;
  title: string;
  description: string | null;
  /** カリキュラム内の表示順（設計書⑫ S10: 体系カリキュラム）。 */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
