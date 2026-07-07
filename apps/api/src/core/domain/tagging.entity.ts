/**
 * タグ付け対象種別（設計書④ taggings のpolymorphic対象）。管理画面(S21)から編集可能な
 * lessonのみ今回実装する（regulation/classificationは編集画面が未実装のため対象外、ユーザー承認済み）。
 */
export type TaggableType = "LESSON";

/**
 * タグ付け（設計書④ taggings 準拠、polymorphic: regulation/lesson/classification）。
 */
export interface Tagging {
  id: string;
  tagId: string;
  taggableType: TaggableType;
  taggableId: string;
  createdAt: Date;
}
